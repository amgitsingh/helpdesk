import { Router } from 'express';
import { inboundEmailSchema } from '@helpdesk/core';
import { requireWebhookSecret } from '../middleware/requireWebhookSecret';
import { parseBody } from '../utils/parseBody';
import prisma from '../lib/prisma';
import { MessageSender, TicketStatus } from '../generated/prisma/client';
import boss from '../lib/boss';
import { CLASSIFY_TICKET_QUEUE } from '../workers/classifyTicketWorker';
import { AUTO_RESOLVE_TICKET_QUEUE } from '../workers/autoResolveTicketWorker';

const router = Router();

router.post('/inbound-email', requireWebhookSecret, async (req, res) => {
  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;

  const { senderEmail, senderName, subject, body } = data;

  const existing = await prisma.ticket.findFirst({
    where: { senderEmail, subject, status: { in: [TicketStatus.new, TicketStatus.processing, TicketStatus.open] } },
    select: { id: true },
  });

  if (existing) {
    await prisma.message.create({
      data: {
        body,
        sender: MessageSender.customer,
        ticketId: existing.id,
      },
    });
    res.status(200).json({ ticketId: existing.id });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: { subject, body, senderEmail, senderName },
  });

  res.status(201).json({ ticketId: ticket.id });

  await boss.send(CLASSIFY_TICKET_QUEUE, { id: ticket.id, subject: ticket.subject, body: ticket.body });
  await boss.send(AUTO_RESOLVE_TICKET_QUEUE, { id: ticket.id, subject: ticket.subject, body: ticket.body, senderName: ticket.senderName });
});

export default router;
