import * as Sentry from '@sentry/node';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import { requireAuth } from './middleware/requireAuth';
import usersRouter from './routes/users';
import webhooksRouter from './routes/webhooks';
import ticketsRouter from './routes/tickets';
import statsRouter from './routes/stats';
import sentryTunnelRouter from './routes/sentryTunnel';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// better-auth handler — must come before express.json()
app.all('/api/auth/*path', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(res.locals.session.user);
});

// Tunneling from Sentry's client SDKs to avoid CORS issues and expose a stable endpoint for clients to send events to
app.use('/api/sentry-tunnel', sentryTunnelRouter);
app.use('/api/users', usersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/stats', statsRouter);

// Sentry error handler — must come before the global error handler
Sentry.setupExpressErrorHandler(app);

// Global error handler — catches async errors forwarded by Express 5
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
