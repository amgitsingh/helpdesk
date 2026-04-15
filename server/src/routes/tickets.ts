import { Router } from 'express';
import { ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, ticketUpdateSchema, createMessageSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import { parseBody } from '../utils/parseBody';
import prisma from '../lib/prisma';
import { MessageSender } from '../generated/prisma/client';

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

router.patch('/:id', requireAuth, async (req, res) => {
  const data = parseBody(ticketUpdateSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.update({
    where: { id: String(req.params.id) },
    data: {
      ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
      ...(data.status       !== undefined ? { status: data.status }             : {}),
      ...(data.category     !== undefined ? { category: data.category }         : {}),
    },
    select: {
      status: true,
      category: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });
  res.json(ticket);
});

router.get('/:id', requireAuth, async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      subject: true,
      body: true,
      senderEmail: true,
      senderName: true,
      status: true,
      category: true,
      aiSummary: true,
      aiSuggestedReply: true,
      createdAt: true,
      updatedAt: true,
      assignedTo: { select: { id: true, name: true } },
      messages: {
        select: {
          id: true,
          body: true,
          sender: true,
          sentAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { sentAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json(ticket);
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  const data = parseBody(createMessageSchema, req.body, res);
  if (!data) return;

  const { session } = res.locals;

  const ticket = await prisma.ticket.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const message = await prisma.message.create({
    data: {
      body: data.body,
      sender: MessageSender.agent,
      ticketId: ticket.id,
      userId: session.user.id,
    },
    select: {
      id: true,
      body: true,
      sender: true,
      sentAt: true,
      user: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(message);
});

export default router;
