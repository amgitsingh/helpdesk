import boss from '../lib/boss';
import { sendEmail } from '../lib/sendEmail';

export const SEND_EMAIL_QUEUE = 'send-email';

export type SendEmailJob = {
  to: string;
  toName: string;
  subject: string;
  text: string;
};

export async function startSendEmailWorker(): Promise<void> {
  await boss.createQueue(SEND_EMAIL_QUEUE, { retryLimit: 5, retryBackoff: true });
  await boss.work<SendEmailJob>(SEND_EMAIL_QUEUE, async ([job]) => {
    await sendEmail(job.data);
  });
}
