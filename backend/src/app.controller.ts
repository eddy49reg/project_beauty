import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { YandexDiskService } from './storage/yandex-disk.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly yandexDisk: YandexDiskService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Публичные флаги для UI (без секретов). */
  @Get('meta/client')
  async clientMeta() {
    const ready = await this.yandexDisk.isWorkPhotoUploadReady();
    return {
      workPhotoUploadEnabled: ready,
      diskAuthMode: ready ? ('oauth' as const) : ('none' as const),
    };
  }
}
