import 'dotenv/config';
import { randomBytes, scrypt } from 'crypto';
import prisma from './lib/prisma';
import { Role } from './generated/prisma/client';

// Replicates @better-auth/utils/password hashPassword exactly
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'), salt, 64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
  return `${salt}:${key.toString('hex')}`;
}

const email = process.env.SEED_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_PASSWORD ?? 'password123';
const name = process.env.SEED_NAME ?? 'Admin';

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`User ${email} already exists — skipping.`);
    await prisma.$disconnect();
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified: true,
      role: Role.admin,
    },
  });

  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: hashed,
    },
  });

  console.log(`Created user: ${email} (role: admin)`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
