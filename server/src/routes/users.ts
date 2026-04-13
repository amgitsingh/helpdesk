import { Router } from 'express';
import { randomBytes, scrypt } from 'crypto';
import { createUserSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import prisma from '../lib/prisma';
import { Role } from '../generated/prisma/client';

const router = Router();

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

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'A user with that email already exists' });
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, emailVerified: true, role: Role.agent },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: hashed,
    },
  });

  res.status(201).json(user);
});

export default router;
