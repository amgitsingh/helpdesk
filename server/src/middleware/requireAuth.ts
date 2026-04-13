import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import prisma from '../lib/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true },
  });

  if (!user) {
    // User has been soft-deleted — purge all their sessions and reject
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.locals.session = session;
  next();
}
