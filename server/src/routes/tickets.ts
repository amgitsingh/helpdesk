import { Router } from 'express';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ticketSortSchema, ticketFilterSchema, ticketPaginationSchema, ticketUpdateSchema, createMessageSchema } from '@helpdesk/core';
import { requireAuth } from '../middleware/requireAuth';
import { parseBody } from '../utils/parseBody';
import prisma from '../lib/prisma';
import { MessageSender, TicketStatus } from '../generated/prisma/client';

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
    // Hide tickets still being processed by the pipeline
    NOT: { status: { in: [TicketStatus.new, TicketStatus.processing] } },
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

router.post('/:id/summarize', requireAuth, async (req, res) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      subject: true,
      body: true,
      senderName: true,
      messages: {
        select: { body: true, sender: true, sentAt: true },
        orderBy: { sentAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const conversation = ticket.messages
    .map((m) => `[${m.sender}]: ${m.body}`)
    .join('\n');

  const { text } = await generateText({
    model: openai('gpt-4.1-nano'),
    prompt: `Summarize the following customer support ticket and its conversation history in 2-3 concise sentences. Focus on the customer's issue and the current resolution status. Return only the summary with no preamble.\n\nTicket subject: ${ticket.subject}\nFrom: ${ticket.senderName}\n\nOriginal message:\n${ticket.body}\n\nConversation:\n${conversation}`,
  });

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { aiSummary: text },
    select: { aiSummary: true },
  });

  res.json(updated);
});

router.post('/:id/polish-reply', requireAuth, async (req, res) => {
  const data = parseBody(createMessageSchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, senderName: true },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const { session } = res.locals;
  const agentName: string = session.user.name;
  const customerName: string = ticket.senderName.split(' ')[0];

  const { text } = await generateText({
    model: openai('gpt-4.1-nano'),
    prompt: `You are a professional customer support agent named ${agentName}. Improve the following draft reply to a support ticket. Make it clear, professional, empathetic, and concise. Address the customer by their first name "${customerName}" at the start of the reply. End the reply with a sign-off using the name "${agentName}". Return only the improved reply with no preamble or explanation.\n\nDraft:\n${data.body}`,
  });

  res.json({ polishedBody: text });
});

export default router;
