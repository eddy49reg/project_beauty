import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
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

  const adminPasswordPlain = 'admin123';
  const passwordHash = await bcrypt.hash(adminPasswordPlain, 12);

  const adminUser = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {
      firstname: 'System',
      surname: 'Admin',
      phone: '+79990000000',
      tg: '@admin',
      passwordHash,
      appRole: 'ADMIN',
    },
    create: {
      login: 'admin',
      firstname: 'System',
      surname: 'Admin',
      phone: '+79990000000',
      tg: '@admin',
      passwordHash,
      appRole: 'ADMIN',
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
