import crypto from 'crypto';
import { RequestHandler } from 'express';

export const requireWebhookSecret: RequestHandler = (req, res, next) => {
  const provided = req.headers['x-webhook-secret'];
  const expected = process.env.WEBHOOK_SECRET!;

  if (
    typeof provided !== 'string' ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
