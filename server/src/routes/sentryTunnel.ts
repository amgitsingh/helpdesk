import { Router } from 'express';
import express from 'express';

const router = Router();

router.post('/', express.text({ type: '*/*', limit: '5mb' }), async (req, res) => {
  try {
    const envelope = req.body as string;
    const header = JSON.parse(envelope.split('\n')[0]) as { dsn?: string };
    if (!header.dsn) { res.status(400).end(); return; }

    const dsn = new URL(header.dsn);
    const projectId = dsn.pathname.replace('/', '');
    const url = `${dsn.protocol}//${dsn.hostname}/api/${projectId}/envelope/`;

    const response = await fetch(url, {
      method: 'POST',
      body: envelope,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
    });

    res.status(response.status).end();
  } catch {
    res.status(500).end();
  }
});

export default router;
