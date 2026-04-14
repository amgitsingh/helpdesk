import { Router } from 'express';
import { ticketSortSchema, ticketFilterSchema, ticketPaginationSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { sortBy, sortDir } = ticketSortSchema.parse(req.query);
  const { status, category, search } = ticketFilterSchema.parse(req.query);
  const { page, pageSize } = ticketPaginationSchema.parse(req.query);

  const where = {
    ...(status   !== undefined ? { status }   : {}),
    ...(category !== undefined ? { category } : {}),
    ...(search ? { OR: [
      { subject:     { contains: search, mode: 'insensitive' as const } },
      { senderName:  { contains: search, mode: 'insensitive' as const } },
      { senderEmail: { contains: search, mode: 'insensitive' as const } },
    ]} : {}),
  };

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ data: tickets, total, page, pageSize });
});

export default router;
