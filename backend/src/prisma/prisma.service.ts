import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

/**
 * PrismaService = адаптер между Nest и Prisma.
 *
 * Что это дает:
 * 1) Мы создаем PrismaClient в одном месте.
 * 2) Nest может "вкалывать" (inject) сервис в любые модули.
 * 3) Управляем подключением/отключением к БД централизованно.
 *
 * Пример использования в сервисе:
 * - this.prisma.user.findMany()
 * - this.prisma.user.create({ data: ... })
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
    });
  }

  /**
   * Вызывается Nest автоматически при старте приложения.
   * Здесь мы открываем подключение к базе данных.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Вызывается Nest автоматически при остановке приложения.
   * Здесь корректно закрываем соединение с БД.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
