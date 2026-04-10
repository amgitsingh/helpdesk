/**
 * seed-agent.ts
 *
 * Creates a test agent user (role: agent) for E2E tests.
 * Reads the same env vars as seed.ts but always writes role = agent.
 *
 * Usage:
 *   SEED_EMAIL=... SEED_PASSWORD=... SEED_NAME=... npm run seed:agent
 */

import 'dotenv/config';
import { randomBytes, scrypt } from 'crypto';
import prisma from './lib/prisma';
import { Role } from './generated/prisma/client';

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
  return `${salt}:${key.toString('hex')}`;
}

const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;
const name = process.env.SEED_NAME ?? 'Test Agent';

if (!email || !password) {
  console.error('SEED_EMAIL and SEED_PASSWORD must be set in environment');
  process.exit(1);
}

const seedEmail = email as string;
const seedPassword = password as string;

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email: seedEmail } });

  if (existing) {
    // If the user exists but has the wrong role (e.g. was created as admin),
    // update the role to agent.
    if (existing.role !== Role.agent) {
      await prisma.user.update({
        where: { email: seedEmail },
        data: { role: Role.agent },
      });
      console.log(`Updated ${seedEmail} role to agent.`);
    } else {
      console.log(`User ${seedEmail} already exists as agent — skipping.`);
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
      role: Role.agent,
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

  console.log(`Created user: ${seedEmail} (role: agent)`);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
