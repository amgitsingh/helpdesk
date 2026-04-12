import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import { requireAuth } from './middleware/requireAuth';
import usersRouter from './routes/users';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// better-auth handler — must come before express.json()
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(res.locals.session.user);
});

app.use('/api/users', usersRouter);

export default app;
