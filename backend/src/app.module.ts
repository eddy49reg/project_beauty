import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ChampionshipsModule } from './championships/championships.module';
import { MembershipsModule } from './memberships/memberships.module';
import { JudgingModule } from './judging/judging.module';
import { NominationsModule } from './nominations/nominations.module';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { ResultsModule } from './results/results.module';
import { UsersModule } from './users/users.module';
import { WorksModule } from './works/works.module';

/**
 * AppModule - "главный контейнер" Nest приложения.
 *
 * Простыми словами:
 * - сюда мы подключаем все модули/сервисы/контроллеры;
 * - Nest читает этот класс и понимает, как собрать приложение.
 *
 * Здесь пока минимум:
 * - AppController: HTTP-роуты (ручки)
 * - AppService: бизнес-логика для этих роутов
 * - PrismaModule: доступ к базе данных (глобально)
 * - AuthModule: вход в систему (JWT)
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    ChampionshipsModule,
    JudgingModule,
    NominationsModule,
    RolesModule,
    ResultsModule,
    UsersModule,
    MembershipsModule,
    WorksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
