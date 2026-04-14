import { Router } from 'express';
import { inboundEmailSchema } from '@helpdesk/core';
import { requireWebhookSecret } from '../middleware/requireWebhookSecret';
import { parseBody } from '../utils/parseBody';
import prisma from '../lib/prisma';

const router = Router();

router.post('/inbound-email', requireWebhookSecret, async (req, res) => {
  const data = parseBody(inboundEmailSchema, req.body, res);
  if (!data) return;

  const { senderEmail, senderName, subject, body } = data;

  const existing = await prisma.ticket.findFirst({
    where: { senderEmail, subject, status: 'open' },
    select: { id: true },
  });

  if (existing) {
    res.status(200).json({ ticketId: existing.id });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: { subject, body, senderEmail, senderName },
  });

  res.status(201).json({ ticketId: ticket.id });
});

export default router;
