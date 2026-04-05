import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

/**
 * Создаем один экземпляр PrismaClient для всего seed-скрипта.
 * Через него выполняем запросы в БД.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const pool = new Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  adapter,
});

async function main(): Promise<void> {
  /**
   * upsert = "обновить если запись есть, иначе создать".
   * Это удобно для сидов, потому что скрипт можно запускать много раз.
   */
  const participantRole = await prisma.role.upsert({
    where: { code: 'participant' },
    update: { title: 'Участник' },
    create: { code: 'participant', title: 'Участник' },
  });

  const judgeRole = await prisma.role.upsert({
    where: { code: 'judge' },
    update: { title: 'Судья' },
    create: { code: 'judge', title: 'Судья' },
  });

  const organizerRole = await prisma.role.upsert({
    where: { code: 'organizer' },
    update: { title: 'Организатор' },
    create: { code: 'organizer', title: 'Организатор' },
  });

  /**
   * Пароль админа только для локальной разработки (смени в проде).
   * Логин: admin / пароль: admin123
   */
  const adminPasswordPlain = 'admin123';
  const passwordHash = await bcrypt.hash(adminPasswordPlain, 10);

  const adminUser = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {
      firstname: 'System',
      surname: 'Admin',
      phone: BigInt(79990000000),
      tg: '@admin',
      passwordHash,
    },
    create: {
      login: 'admin',
      firstname: 'System',
      surname: 'Admin',
      phone: BigInt(79990000000),
      tg: '@admin',
      passwordHash,
    },
  });

  console.log('Seed completed successfully');
  console.log({
    roles: [participantRole.code, judgeRole.code, organizerRole.code],
    adminUserId: adminUser.id,
    adminLogin: adminUser.login,
    devHint: 'Login: admin / Password: admin123',
  });
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
