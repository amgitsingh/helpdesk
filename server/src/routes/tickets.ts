import { Router } from 'express';
import { ticketSortSchema, ticketFilterSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { sortBy, sortDir } = ticketSortSchema.parse(req.query);
  const { status, category, search } = ticketFilterSchema.parse(req.query);

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status   !== undefined ? { status }   : {}),
      ...(category !== undefined ? { category } : {}),
      ...(search ? { OR: [
        { subject:     { contains: search, mode: 'insensitive' } },
        { senderName:  { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
      ]} : {}),
    },
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
    orderBy: { [sortBy]: sortDir },
  });
  res.json(tickets);
});

export default router;
