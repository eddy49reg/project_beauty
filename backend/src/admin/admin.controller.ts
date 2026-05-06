import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtAccessPayload } from '../auth/types/jwt-access.payload';
import { AdminService } from './admin.service';
import { UpdateUserAppRoleDto } from './dto/update-user-app-role.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
