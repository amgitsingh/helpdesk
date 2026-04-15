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
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <span className="text-muted-foreground">{icon}</span>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-24" />
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {statsError && (
        <Card>
          <CardContent className="pt-6">
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
              icon={<Ticket size={18} />}
              label="Total Tickets"
              value={stats.totalTickets}
            />
            <StatCard
              icon={<TicketCheck size={18} />}
              label="Open Tickets"
              value={stats.openTickets}
            />
            <StatCard
              icon={<Bot size={18} />}
              label="Resolved by AI"
              value={stats.aiResolvedTickets}
            />
            <StatCard
              icon={<Percent size={18} />}
              label="AI Resolution Rate"
              value={`${stats.aiResolvedPercentage}%`}
            />
            <StatCard
              icon={<Clock size={18} />}
              label="Avg. Resolution Time"
              value={formatDuration(stats.avgResolutionTimeMs)}
            />
          </>
        ) : null}
      </div>

      {/* Daily tickets bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tickets per Day — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyError && (
            <p className="text-sm text-destructive">Failed to load chart data.</p>
          )}
          {dailyPending && <Skeleton className="h-56 w-full rounded" />}
          {daily && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatAxisDate}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [value, 'Tickets']}
                  labelFormatter={(label) => (typeof label === 'string' ? formatAxisDate(label) : label)}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
