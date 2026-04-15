import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../lib/prisma';
import { AI_AGENT_EMAIL } from '../lib/autoResolveTicket';
import type { DashboardStats } from '@helpdesk/core';

interface DashboardStatsRow {
  total_tickets: bigint;
  open_tickets: bigint;
  ai_resolved_tickets: bigint;
  ai_resolved_percentage: number;
  avg_resolution_time_ms: number;
}

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const [row] = await prisma.$queryRaw<DashboardStatsRow[]>`SELECT * FROM get_dashboard_stats(${AI_AGENT_EMAIL})`;

  const stats: DashboardStats = {
    totalTickets:          Number(row.total_tickets),
    openTickets:           Number(row.open_tickets),
    aiResolvedTickets:     Number(row.ai_resolved_tickets),
    aiResolvedPercentage:  Number(row.ai_resolved_percentage),
    avgResolutionTimeMs:   Number(row.avg_resolution_time_ms),
  };

  res.json(stats);
});

router.get('/daily-tickets', requireAuth, async (_req, res) => {
  // Raw query: count tickets per day for the past 30 days
  const rows = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT
      DATE("createdAt") AS date,
      COUNT(*)          AS count
    FROM "Ticket"
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Build a full 30-day series, filling gaps with 0
  const today = new Date();
  const series: { date: string; count: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const row = rows.find((r) => r.date.toISOString().slice(0, 10) === iso);
    series.push({ date: iso, count: row ? Number(row.count) : 0 });
  }

  res.json(series);
});

export default router;
