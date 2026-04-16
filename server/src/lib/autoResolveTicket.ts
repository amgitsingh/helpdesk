import { readFileSync } from 'fs';
import { join } from 'path';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import prisma from './prisma';
import boss from './boss';
import { MessageSender, TicketStatus } from '../generated/prisma/client';
import type { TicketModel } from '../generated/prisma/models/Ticket';
import { SEND_EMAIL_QUEUE } from '../workers/sendEmailWorker';

export const AI_AGENT_EMAIL = 'ai@helpdesk.internal';

const knowledgeBase = readFileSync(
  join(__dirname, '../../KNOWLEDGE_BASE.md'),
  'utf-8',
);

export async function autoResolveTicket(
  ticket: Pick<TicketModel, 'id' | 'subject' | 'body' | 'senderName' | 'senderEmail'>,
): Promise<void> {
  const firstName = ticket.senderName.split(' ')[0];

  const aiAgent = await prisma.user.findUnique({
    where: { email: AI_AGENT_EMAIL },
    select: { id: true },
  });

  // Move to processing and assign to the AI agent
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: TicketStatus.processing, assignedToId: aiAgent?.id ?? null },
  });

  let result: { canResolve: boolean; reply?: string };
  try {
    const { text } = await generateText({
      model: openai('gpt-4.1-nano'),
      prompt: `You are a friendly customer support agent for Arkitek, an online learning platform.

Below is the support knowledge base containing FAQs and their answers:

${knowledgeBase}

A customer named ${firstName} has submitted a support ticket:
Subject: ${ticket.subject}
Body: ${ticket.body}

If the knowledge base contains a clear answer to this ticket, respond with this exact JSON:
{ "canResolve": true, "reply": "<your reply here>" }

If the ticket cannot be answered from the knowledge base, respond with:
{ "canResolve": false }

Rules:
- Only use information from the knowledge base — do not make up answers.
- If you can resolve it, write a warm, friendly reply using plain paragraphs (no bullet points or markdown).
- Open with "Hi ${firstName}," and close with "\\n\\nWarm regards,\\nArkitek Support Team".
- Respond with JSON only, no extra text.`,
    });
    result = JSON.parse(text.trim());
  } catch {
    // generateText failed or returned malformed JSON — unassign and hand off to an agent
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.open, assignedToId: null },
    });
    return;
  }

  if (result.canResolve && result.reply) {
    await prisma.message.create({
      data: {
        body: result.reply,
        sender: MessageSender.ai,
        ticketId: ticket.id,
      },
    });
    // Keep assigned to AI agent — it resolved the ticket
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.resolved },
    });
    await boss.send(SEND_EMAIL_QUEUE, {
      to: ticket.senderEmail,
      toName: ticket.senderName,
      subject: `Re: ${ticket.subject}`,
      text: result.reply,
    });
  } else {
    // AI could not resolve — unassign so a human agent can pick it up
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.open, assignedToId: null },
    });
  }
}
