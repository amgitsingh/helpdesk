import boss from '../lib/boss';
import { classifyTicket } from '../lib/classifyTicket';

export const CLASSIFY_TICKET_QUEUE = 'classify-ticket';

export type ClassifyTicketJob = {
  id: string;
  subject: string;
  body: string;
};

export async function startClassifyTicketWorker(): Promise<void> {
  await boss.createQueue(CLASSIFY_TICKET_QUEUE, { retryLimit: 3, retryBackoff: true });
  await boss.work<ClassifyTicketJob>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    await classifyTicket(job.data);
  });
}
