import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
