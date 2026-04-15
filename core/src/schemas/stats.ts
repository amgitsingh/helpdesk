export type DashboardStats = {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercentage: number; // 0–100, one decimal place
  avgResolutionTimeMs: number;  // 0 if no resolved tickets yet
};

export type DailyTicketCount = {
  date: string; // "YYYY-MM-DD"
  count: number;
};
