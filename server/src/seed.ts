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

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;
const name = process.env.SEED_NAME ?? 'Admin';

if (!email || !password) {
  console.error('SEED_EMAIL and SEED_PASSWORD must be set in environment');
  process.exit(1);
}

const seedEmail = email as string;
const seedPassword = password as string;

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email: seedEmail } });

  if (existing) {
    console.log(`User ${seedEmail} already exists — skipping.`);

    // Still ensure the AI agent exists
    const aiEmail = 'ai@helpdesk.internal';
    const aiExists = await prisma.user.findUnique({ where: { email: aiEmail } });
    if (!aiExists) {
      await prisma.user.create({
        data: { name: 'AI', email: aiEmail, emailVerified: true, role: Role.agent },
      });
      console.log('AI agent created.');
    } else {
      console.log('AI agent already exists — skipping.');
    }
    await prisma.$disconnect();
    return;
  }

  const hashed = await hashPassword(seedPassword);

  const user = await prisma.user.create({
    data: {
      name,
      email: seedEmail,
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

  console.log(`Created user: ${seedEmail} (role: admin)`);

  // AI agent — system account used by the auto-resolve pipeline
  const aiEmail = 'ai@helpdesk.internal';
  const aiExists = await prisma.user.findUnique({ where: { email: aiEmail } });
  if (aiExists) {
    console.log('AI agent already exists — skipping.');
  } else {
    await prisma.user.create({
      data: { name: 'AI', email: aiEmail, emailVerified: true, role: Role.agent },
    });
    console.log('AI agent created.');
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
