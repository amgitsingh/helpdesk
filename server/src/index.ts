import 'dotenv/config'; // must be first — loads env before any other module reads process.env
import './instrument';  // Sentry — must be imported before any other modules
import app from './app';
import boss from './lib/boss';
import { startClassifyTicketWorker } from './workers/classifyTicketWorker';
import { startAutoResolveTicketWorker } from './workers/autoResolveTicketWorker';
import { startSendEmailWorker } from './workers/sendEmailWorker';

const requiredEnv = ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'DATABASE_URL', 'CLIENT_URL', 'WEBHOOK_SECRET', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.BETTER_AUTH_SECRET!.length < 32) {
  console.error('BETTER_AUTH_SECRET must be at least 32 characters');
  process.exit(1);
}

const PORT = process.env.PORT ?? 5000;

async function start() {
  await boss.start();
  await startClassifyTicketWorker();
  await startAutoResolveTicketWorker();
  await startSendEmailWorker();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
