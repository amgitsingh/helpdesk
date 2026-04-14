import { Router } from 'express';
import { randomBytes, scrypt } from 'crypto';
import { createUserSchema, editUserSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { parseBody } from '../utils/parseBody';
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
    where: { deletedAt: null },
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
  const data = parseBody(createUserSchema, req.body, res);
  if (!data) return;

  const { name, email, password } = data;

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

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = req.params['id'] as string;

  const data = parseBody(editUserSchema, req.body, res);
  if (!data) return;

  const { name, email, password } = data;

  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      res.status(409).json({ error: 'A user with that email already exists' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name, email },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (password) {
    const hashed = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: 'credential' },
      data: { password: hashed },
    });
  }

  res.json(user);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = req.params['id'] as string;

  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (existing.role === Role.admin) {
    res.status(403).json({ error: 'Admin users cannot be deleted' });
    return;
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { deletedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
  res.status(204).send();
});

export default router;
