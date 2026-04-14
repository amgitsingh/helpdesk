import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SortingState, type OnChangeFn } from "@tanstack/react-table";
import axios from "axios";
import { type Ticket, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketTable } from "@/components/TicketTable";

async function fetchTickets(
  sortBy: string,
  sortDir: string,
  status?: TicketStatus,
  category?: TicketCategory,
  search?: string,
): Promise<Ticket[]> {
  const { data } = await axios.get<Ticket[]>("/api/tickets", {
    withCredentials: true,
    params: {
      sortBy,
      sortDir,
      ...(status   !== undefined ? { status }   : {}),
      ...(category !== undefined ? { category } : {}),
      ...(search   ? { search }                 : {}),
    },
  });
  return data;
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [statusFilter,   setStatusFilter]   = useState<TicketStatus | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | undefined>(undefined);
  const [searchInput,    setSearchInput]    = useState("");
  const [search,         setSearch]         = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const sortBy  = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ["tickets", sortBy, sortDir, statusFilter, categoryFilter, search],
    queryFn: () => fetchTickets(sortBy, sortDir, statusFilter, categoryFilter, search || undefined),
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  function handleStatusChange(value: string) {
    setStatusFilter(value === "" ? undefined : (value as TicketStatus));
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value === "" ? undefined : (value as TicketCategory));
  }

  function clearFilters() {
    setStatusFilter(undefined);
    setCategoryFilter(undefined);
    setSearchInput("");
  }

  const hasActiveFilter =
    statusFilter !== undefined ||
    categoryFilter !== undefined ||
    searchInput !== "";

  return (
    <div className="max-w-7xl p-6 mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Tickets</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Search tickets…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search tickets"
              className="w-56"
            />

            <Select value={statusFilter ?? ""} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value={TicketStatus.open}>Open</SelectItem>
                <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter ?? ""} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-44" aria-label="Filter by category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value={TicketCategory.general_question}>General Question</SelectItem>
                <SelectItem value={TicketCategory.technical_question}>Technical Question</SelectItem>
                <SelectItem value={TicketCategory.refund_request}>Refund Request</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TicketTable
            tickets={tickets}
            isPending={isPending}
            isError={isError}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
