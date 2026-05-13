import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DISK_API = 'https://cloud-api.yandex.net/v1/disk';
const TOKEN_URL = 'https://oauth.yandex.ru/token';
const YANDEX_OAUTH_AUTHORIZE = 'https://oauth.yandex.ru/authorize';
/** Redirect для сценария «код на странице подтверждения» (совпадает с настройкой приложения в Яндексе). */
const YANDEX_OAUTH_VERIFICATION_REDIRECT =
  'https://oauth.yandex.ru/verification_code';
const YANDEX_DISK_OAUTH_SCOPES = 'cloud_api:disk.read cloud_api:disk.write';
/** Обновлять access_token заранее, сек. */
const ACCESS_SKEW_SEC = 120;

type YandexTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

@Injectable()
export class YandexDiskService implements OnModuleInit {
  private readonly logger = new Logger(YandexDiskService.name);
  private refreshMutex: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.warmupManagedOAuthIfPossible();
  }

  private oauthClientId(): string | undefined {
    return (
      this.config.get<string>('YANDEX_DISK_OAUTH_CLIENT_ID')?.trim() ||
      undefined
    );
  }

  private oauthClientSecret(): string | undefined {
    return (
      this.config.get<string>('YANDEX_DISK_OAUTH_CLIENT_SECRET')?.trim() ||
      undefined
    );
  }

  /** Управляемый OAuth: в .env только client_id + client_secret; refresh приходит от Яндекса после обмена code и хранится в БД. */
  isManagedOAuthConfigured(): boolean {
    return Boolean(this.oauthClientId() && this.oauthClientSecret());
  }

  /** Есть client+secret и непустой refresh в БД — можно грузить фото и ходить в API Диска. */
  async isWorkPhotoUploadReady(): Promise<boolean> {
    if (!this.isManagedOAuthConfigured()) {
      return false;
    }
    const row = await this.prisma.yandexDiskOAuthState.findUnique({
      where: { id: 1 },
      select: { refreshToken: true },
    });
    return Boolean(row?.refreshToken?.trim());
  }

  async assertConfigured(): Promise<void> {
    if (!(await this.isWorkPhotoUploadReady())) {
      throw new ServiceUnavailableException(
        'Загрузка файлов отключена: задайте YANDEX_DISK_OAUTH_CLIENT_ID и YANDEX_DISK_OAUTH_CLIENT_SECRET, затем один раз выполните OAuth (GET /admin/yandex-disk/oauth/authorize-url и POST /admin/yandex-disk/oauth/exchange-code).',
      );
    }
  }

  /**
   * Ссылка для открытия в браузере (под аккаунтом Яндекса, куда нужен Диск).
   * После подтверждения Яндекс покажет код — его передают в exchange-code.
   */
  buildYandexOAuthAuthorizeUrl(): string {
    const clientId = this.oauthClientId();
    if (!clientId) {
      throw new BadRequestException(
        'Задайте YANDEX_DISK_OAUTH_CLIENT_ID в окружении backend.',
      );
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: YANDEX_OAUTH_VERIFICATION_REDIRECT,
      scope: YANDEX_DISK_OAUTH_SCOPES,
    });
    return `${YANDEX_OAUTH_AUTHORIZE}?${params.toString()}`;
  }

  /**
   * Обмен authorization code на токены (вызывает Яндекс) и сохранение в `yandex_disk_oauth_state`.
   */
  async exchangeAuthorizationCodeAndPersist(
    code: string,
  ): Promise<{ ok: true }> {
    const clientId = this.oauthClientId();
    const clientSecret = this.oauthClientSecret();
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Задайте YANDEX_DISK_OAUTH_CLIENT_ID и YANDEX_DISK_OAUTH_CLIENT_SECRET.',
      );
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: YANDEX_OAUTH_VERIFICATION_REDIRECT,
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const raw = await res.text();
    let json: YandexTokenResponse;
    try {
      json = JSON.parse(raw) as YandexTokenResponse;
    } catch {
      throw new BadRequestException(
        `Ответ Яндекса не JSON (${res.status}): ${raw.slice(0, 400)}`,
      );
    }
    if (!res.ok || json.error) {
      throw new BadRequestException(
        `Обмен code на токены: ${res.status} ${json.error ?? ''} ${json.error_description ?? raw.slice(0, 300)}`,
      );
    }
    const access = json.access_token;
    const refresh = json.refresh_token?.trim();
    if (!access) {
      throw new BadRequestException('В ответе Яндекса нет access_token');
    }
    if (!refresh) {
      throw new BadRequestException(
        'В ответе Яндекса нет refresh_token — проверьте scope приложения (нужен доступ к Диску).',
      );
    }
    const expiresIn =
      typeof json.expires_in === 'number' && Number.isFinite(json.expires_in)
        ? json.expires_in
        : 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await this.prisma.yandexDiskOAuthState.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        refreshToken: refresh,
        accessToken: access,
        accessTokenExpiresAt: expiresAt,
      },
      update: {
        refreshToken: refresh,
        accessToken: access,
        accessTokenExpiresAt: expiresAt,
      },
    });
    this.logger.log(
      `Yandex Disk OAuth: получены токены по authorization_code, refresh сохранён в БД (expires_at=${expiresAt.toISOString()}).`,
    );
    return { ok: true };
  }

  private async warmupManagedOAuthIfPossible(): Promise<void> {
    if (!(await this.isWorkPhotoUploadReady())) {
      return;
    }
    try {
      await this.getOAuthAccessTokenForApi();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Yandex Disk OAuth: прогрев access_token не удался (приложение стартует): ${msg}`,
      );
    }
  }

  private async getOAuthAccessTokenForApi(): Promise<string> {
    if (!this.isManagedOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'OAuth: задайте YANDEX_DISK_OAUTH_CLIENT_ID и YANDEX_DISK_OAUTH_CLIENT_SECRET, затем выполните привязку через POST /admin/yandex-disk/oauth/exchange-code.',
      );
    }
    return this.getManagedOAuthAccessToken();
  }

  private async getManagedOAuthAccessToken(): Promise<string> {
    const clientId = this.oauthClientId()!;
    const clientSecret = this.oauthClientSecret()!;

    const row = await this.prisma.yandexDiskOAuthState.findUnique({
      where: { id: 1 },
    });
    if (!row?.refreshToken?.trim()) {
      throw new ServiceUnavailableException(
        'OAuth: нет refresh_token в БД. Администратор: GET /admin/yandex-disk/oauth/authorize-url → браузер → POST /admin/yandex-disk/oauth/exchange-code с телом { "code": "…" }.',
      );
    }

    const now = Date.now();
    if (
      row.accessToken.length > 0 &&
      row.accessTokenExpiresAt.getTime() - ACCESS_SKEW_SEC * 1000 > now
    ) {
      return row.accessToken;
    }

    await this.withRefreshLock(async () => {
      const latest = await this.prisma.yandexDiskOAuthState.findUnique({
        where: { id: 1 },
      });
      if (!latest?.refreshToken) {
        throw new ServiceUnavailableException(
          'OAuth: refresh_token пропал из БД.',
        );
      }
      const t = Date.now();
      if (
        latest.accessToken.length > 0 &&
        latest.accessTokenExpiresAt.getTime() - ACCESS_SKEW_SEC * 1000 > t
      ) {
        return;
      }
      await this.performTokenRefresh(
        latest.refreshToken,
        clientId,
        clientSecret,
      );
    });

    const after = await this.prisma.yandexDiskOAuthState.findUnique({
      where: { id: 1 },
    });
    if (!after?.accessToken) {
      throw new ServiceUnavailableException(
        'OAuth: не удалось получить access_token.',
      );
    }
    return after.accessToken;
  }

  private async withRefreshLock(fn: () => Promise<void>): Promise<void> {
    if (this.refreshMutex) {
      await this.refreshMutex;
      return;
    }
    this.refreshMutex = (async () => {
      try {
        await fn();
      } finally {
        this.refreshMutex = null;
      }
    })();
    await this.refreshMutex;
  }

  private async performTokenRefresh(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const raw = await res.text();
    let json: YandexTokenResponse;
    try {
      json = JSON.parse(raw) as YandexTokenResponse;
    } catch {
      throw new Error(
        `OAuth token endpoint: не JSON (${res.status}): ${raw.slice(0, 400)}`,
      );
    }
    if (!res.ok || json.error) {
      throw new Error(
        `OAuth refresh failed: ${res.status} ${json.error ?? ''} ${json.error_description ?? raw.slice(0, 300)}`,
      );
    }
    const access = json.access_token;
    if (!access) {
      throw new Error('OAuth refresh: нет access_token в ответе');
    }
    const expiresIn =
      typeof json.expires_in === 'number' && Number.isFinite(json.expires_in)
        ? json.expires_in
        : 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const newRefresh = json.refresh_token?.trim() || refreshToken;

    await this.prisma.yandexDiskOAuthState.update({
      where: { id: 1 },
      data: {
        refreshToken: newRefresh,
        accessToken: access,
        accessTokenExpiresAt: expiresAt,
      },
    });
    this.logger.log(
      `Yandex Disk OAuth: access_token обновлён, действует ~${expiresIn}s (expires_at=${expiresAt.toISOString()}).`,
    );
  }

  private async authHeaders(): Promise<HeadersInit> {
    if (!(await this.isWorkPhotoUploadReady())) {
      throw new ServiceUnavailableException(
        'Яндекс.Диск: нет привязки OAuth (client/secret в .env и refresh в БД после exchange-code).',
      );
    }
    const token = await this.getOAuthAccessTokenForApi();
    return { Authorization: `OAuth ${token}` };
  }

  private rootFolder(): string {
    const raw = this.config.get<string>('YANDEX_DISK_ROOT_FOLDER')?.trim();
    const name =
      raw && raw.length > 0
        ? raw.replace(/^\/+|\/+$/g, '')
        : 'beauty-championship-uploads';
    return `disk:/${name}`;
  }

  buildObjectPath(
    championshipId: number,
    workId: number,
    safeFileName: string,
  ): string {
    return `${this.rootFolder()}/championships/${championshipId}/works/${workId}/${safeFileName}`;
  }

  /** Родительские каталоги для пути к файлу `disk:/…/file.ext` (сами папки, без файла). */
  private parentFolderChainForFile(diskPath: string): string[] {
    const prefix = 'disk:/';
    if (!diskPath.startsWith(prefix)) {
      throw new Error(
        `Yandex.Disk: ожидался путь с префиксом disk:/, получено: ${diskPath}`,
      );
    }
    const rest = diskPath.slice(prefix.length);
    const parts = rest.split('/').filter((p) => p.length > 0);
    if (parts.length < 2) {
      return [];
    }
    const dirs: string[] = [];
    for (let i = 0; i < parts.length - 1; i += 1) {
      dirs.push(`${prefix}${parts.slice(0, i + 1).join('/')}`);
    }
    return dirs;
  }

  /**
   * API загрузки не создаёт промежуточные папки — создаём цепочку каталогов (идемпотентно).
   */
  private async ensureFolderExists(diskFolderPath: string): Promise<void> {
    const url = `${DISK_API}/resources?path=${encodeURIComponent(diskFolderPath)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: await this.authHeaders(),
    });
    if (res.status === 201 || res.status === 200) {
      return;
    }
    if (res.status === 409) {
      const text = await res.text().catch(() => '');
      if (
        text.includes('PathPointsToExistentDirectoryError') ||
        text.includes('specified path points to existent directory') ||
        text.includes('уже существует')
      ) {
        return;
      }
    }
    if (res.ok) {
      return;
    }
    const text = await res.text().catch(() => '');
    throw new Error(
      `Yandex.Disk create folder failed (${diskFolderPath}): ${res.status} ${text}`,
    );
  }

  private async ensureParentFoldersForUpload(
    diskFilePath: string,
  ): Promise<void> {
    for (const folder of this.parentFolderChainForFile(diskFilePath)) {
      await this.ensureFolderExists(folder);
    }
  }

  async getUploadHref(diskPath: string): Promise<string> {
    await this.ensureParentFoldersForUpload(diskPath);
    const url = `${DISK_API}/resources/upload?overwrite=true&path=${encodeURIComponent(diskPath)}`;
    const res = await fetch(url, { headers: await this.authHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Yandex.Disk upload URL failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { href?: string };
    if (!json.href) {
      throw new Error('Yandex.Disk upload URL response has no href');
    }
    return json.href;
  }

  async putFile(
    uploadHref: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const res = await fetch(uploadHref, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: new Uint8Array(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Yandex.Disk PUT upload failed: ${res.status} ${text}`);
    }
  }

  async publishPath(diskPath: string): Promise<void> {
    const url = `${DISK_API}/resources/publish?path=${encodeURIComponent(diskPath)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: await this.authHeaders(),
    });
    if (!res.ok && res.status !== 202) {
      const text = await res.text().catch(() => '');
      throw new Error(`Yandex.Disk publish failed: ${res.status} ${text}`);
    }
  }

  async getResourceMeta(
    diskPath: string,
  ): Promise<{ publicUrl: string | null }> {
    const url = `${DISK_API}/resources?path=${encodeURIComponent(diskPath)}`;
    const res = await fetch(url, { headers: await this.authHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Yandex.Disk meta failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { public_url?: string | null };
    return { publicUrl: json.public_url ?? null };
  }

  /** Публикует файл и несколько раз опрашивает мету, пока не появится public_url. */
  async publishAndResolvePublicUrl(diskPath: string): Promise<string | null> {
    await this.publishPath(diskPath);
    for (let i = 0; i < 8; i += 1) {
      const { publicUrl } = await this.getResourceMeta(diskPath);
      if (publicUrl) {
        return publicUrl;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return null;
  }

  async deleteResource(diskPath: string): Promise<void> {
    const url = `${DISK_API}/resources?path=${encodeURIComponent(diskPath)}&permanently=true`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: await this.authHeaders(),
    });
    if (res.status === 404) {
      return;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Yandex.Disk delete failed: ${res.status} ${text}`);
    }
  }

  /**
   * Скачивание файла по пути на Диске (OAuth): href от API, затем GET по этому href.
   */
  async fetchFileByDiskPath(
    diskPath: string,
  ): Promise<{ body: Buffer; contentType: string }> {
    const metaUrl = `${DISK_API}/resources/download?path=${encodeURIComponent(diskPath)}`;
    const metaRes = await fetch(metaUrl, { headers: await this.authHeaders() });
    if (!metaRes.ok) {
      const text = await metaRes.text().catch(() => '');
      throw new Error(
        `Yandex.Disk download meta failed: ${metaRes.status} ${text}`,
      );
    }
    const metaJson = (await metaRes.json()) as { href?: string };
    if (!metaJson.href) {
      throw new Error('Yandex.Disk download meta: нет href');
    }
    const binRes = await fetch(metaJson.href, { method: 'GET' });
    if (!binRes.ok) {
      const text = await binRes.text().catch(() => '');
      throw new Error(
        `Yandex.Disk file fetch failed: ${binRes.status} ${text}`,
      );
    }
    const body = Buffer.from(await binRes.arrayBuffer());
    const rawCt = binRes.headers.get('content-type')?.split(';')[0]?.trim();
    const contentType =
      rawCt && rawCt.length > 0 ? rawCt : 'application/octet-stream';
    return { body, contentType };
  }
}
