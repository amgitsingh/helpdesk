import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      senderEmail: true,
      senderName: true,
      status: true,
      category: true,
      createdAt: true,
      assignedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tickets);
});

export default router;
