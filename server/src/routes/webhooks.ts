import { Router } from 'express';
import multer from 'multer';
import Parse from '@sendgrid/inbound-mail-parser';
import { inboundEmailSchema } from '@helpdesk/core';
import { requireWebhookSecret } from '../middleware/requireWebhookSecret';
import prisma from '../lib/prisma';
import { MessageSender, TicketStatus } from '../generated/prisma/client';
import boss from '../lib/boss';
import { CLASSIFY_TICKET_QUEUE } from '../workers/classifyTicketWorker';
import { AUTO_RESOLVE_TICKET_QUEUE } from '../workers/autoResolveTicketWorker';

const router = Router();

// SendGrid sends inbound email as multipart/form-data
const upload = multer();

// Parses a "From" header value into a name and email address.
// Handles: "John Doe <john@example.com>", <john@example.com>, john@example.com
function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>/);
  if (match) {
    const name = match[1]?.trim();
    const email = match[2].trim();
    return { name: name || email, email };
  }
  const email = from.trim();
  return { name: email, email };
}

router.post(
  '/inbound-email',
  upload.any(),          // parse multipart/form-data before auth check
  requireWebhookSecret,
  async (req, res) => {
    const parser = new Parse(
      { keys: ['from', 'subject', 'text', 'html'] },
      { body: req.body, files: (req as any).files ?? [] },
    );

    const fields = parser.keyValues();

    const rawFrom    = fields.from    as string | undefined;
    const rawSubject = fields.subject as string | undefined;
    const rawBody    = (fields.text || fields.html) as string | undefined;

    if (!rawFrom || !rawSubject || !rawBody) {
      res.status(400).json({ error: 'Missing required email fields: from, subject, or body' });
      return;
    }

    const { name: senderName, email: senderEmail } = parseFrom(rawFrom);

    // Reuse the existing schema for subject normalisation (strips Re:/Fwd: etc.) and length limits
    const parsed = inboundEmailSchema.safeParse({
      senderEmail,
      senderName,
      subject: rawSubject,
      body: rawBody,
    });

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { senderEmail: email, senderName: name, subject, body } = parsed.data;

    const existing = await prisma.ticket.findFirst({
      where: { senderEmail: email, subject, status: { in: [TicketStatus.new, TicketStatus.processing, TicketStatus.open] } },
      select: { id: true },
    });

    if (existing) {
      await prisma.message.create({
        data: { body, sender: MessageSender.customer, ticketId: existing.id },
      });
      res.status(200).json({ ticketId: existing.id });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: { subject, body, senderEmail: email, senderName: name },
    });

    res.status(201).json({ ticketId: ticket.id });

    await boss.send(CLASSIFY_TICKET_QUEUE, { id: ticket.id, subject: ticket.subject, body: ticket.body });
    await boss.send(AUTO_RESOLVE_TICKET_QUEUE, { id: ticket.id, subject: ticket.subject, body: ticket.body, senderName: ticket.senderName, senderEmail: ticket.senderEmail });
  },
);

export default router;
