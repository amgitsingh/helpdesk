import boss from '../lib/boss';
import { autoResolveTicket } from '../lib/autoResolveTicket';

export const AUTO_RESOLVE_TICKET_QUEUE = 'auto-resolve-ticket';

export type AutoResolveTicketJob = {
  id: string;
  subject: string;
  body: string;
  senderName: string;
};

export async function startAutoResolveTicketWorker(): Promise<void> {
  await boss.createQueue(AUTO_RESOLVE_TICKET_QUEUE);
  await boss.work<AutoResolveTicketJob>(AUTO_RESOLVE_TICKET_QUEUE, async ([job]) => {
    await autoResolveTicket(job.data);
  });
}
