import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { YandexDiskService } from '../storage/yandex-disk.service';
import { AdminService } from './admin.service';
import { ExchangeYandexOAuthCodeDto } from './dto/exchange-yandex-oauth-code.dto';
import { UpdateUserAppRoleDto } from './dto/update-user-app-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly yandexDisk: YandexDiskService,
  ) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/app-role')
  setAppRole(
    @CurrentUser() actor: JwtAccessPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAppRoleDto,
  ) {
    return this.adminService.setUserAppRole(actor.sub, id, dto.appRole);
  }

  /** Ссылка для входа в аккаунт Яндекса и выдачи кода подтверждения (без секретов в ответе). */
  @Get('yandex-disk/oauth/authorize-url')
  getYandexDiskOAuthAuthorizeUrl() {
    return { authorizeUrl: this.yandexDisk.buildYandexOAuthAuthorizeUrl() };
  }

  /** Обмен `code` на пару токенов и сохранение refresh/access в БД (один раз на пустую таблицу или повторная привязка). */
  @Post('yandex-disk/oauth/exchange-code')
  exchangeYandexDiskOAuthCode(@Body() dto: ExchangeYandexOAuthCodeDto) {
    return this.yandexDisk.exchangeAuthorizationCodeAndPersist(dto.code.trim());
  }
}
