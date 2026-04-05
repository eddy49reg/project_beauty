import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

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
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
