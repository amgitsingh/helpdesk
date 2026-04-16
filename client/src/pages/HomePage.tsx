import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Ticket, TicketCheck, Bot, Percent, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats, DailyTicketCount } from '@helpdesk/core';
import { cn } from '@/lib/utils';

async function fetchStats(): Promise<DashboardStats> {
  const { data } = await axios.get<DashboardStats>('/api/stats', {
    withCredentials: true,
  });
  return data;
}

async function fetchDailyTickets(): Promise<DailyTicketCount[]> {
  const { data } = await axios.get<DailyTicketCount[]>('/api/stats/daily-tickets', {
    withCredentials: true,
  });
  return data;
}

function formatDuration(ms: number): string {
  if (ms === 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatAxisDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: string;
};

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* top accent line */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5', accent ?? 'bg-primary/60')} />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 dark:bg-primary/15 text-primary flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-border" />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-9 w-20 rounded" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { data: stats, isPending: statsPending, isError: statsError } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  const { data: daily, isPending: dailyPending, isError: dailyError } = useQuery({
    queryKey: ['stats', 'daily-tickets'],
    queryFn: fetchDailyTickets,
  });

  return (
    <div className="max-w-5xl mx-auto px-5 py-7 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your support operations
        </p>
      </div>

      {statsError && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-destructive">Failed to load dashboard stats.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsPending ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              icon={<Ticket size={18} strokeWidth={2} />}
              label="Total Tickets"
              value={stats.totalTickets}
            />
            <StatCard
              icon={<TicketCheck size={18} strokeWidth={2} />}
              label="Open Tickets"
              value={stats.openTickets}
            />
            <StatCard
              icon={<Bot size={18} strokeWidth={2} />}
              label="Resolved by AI"
              value={stats.aiResolvedTickets}
            />
            <StatCard
              icon={<Percent size={18} strokeWidth={2} />}
              label="AI Resolution Rate"
              value={`${stats.aiResolvedPercentage}%`}
            />
            <StatCard
              icon={<Clock size={18} strokeWidth={2} />}
              label="Avg. Resolution Time"
              value={formatDuration(stats.avgResolutionTimeMs)}
            />
          </>
        ) : null}
      </div>

      {/* Daily tickets bar chart */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tickets per Day — Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {dailyError && (
            <p className="text-sm text-destructive">Failed to load chart data.</p>
          )}
          {dailyPending && <Skeleton className="h-56 w-full rounded-lg" />}
          {daily && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-chart-grid)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Tickets']}
                  labelFormatter={(label) =>
                    typeof label === 'string' ? formatAxisDate(label) : label
                  }
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }}
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: 12,
                    color: 'var(--color-foreground)',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
