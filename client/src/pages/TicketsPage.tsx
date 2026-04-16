import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SortingState, type OnChangeFn } from "@tanstack/react-table";
import axios from "axios";
import { type TicketPage, TicketStatus, TicketCategory } from "@helpdesk/core";
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

const PAGE_SIZE = 10;

async function fetchTickets(
  sortBy: string,
  sortDir: string,
  page: number,
  status?: TicketStatus,
  category?: TicketCategory,
  search?: string,
): Promise<TicketPage> {
  const { data } = await axios.get<TicketPage>("/api/tickets", {
    withCredentials: true,
    params: {
      sortBy,
      sortDir,
      page,
      pageSize: PAGE_SIZE,
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
  const [page,           setPage]           = useState(1);

  const sortBy  = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  // Debounce raw search input → committed search value
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 whenever filters or sort change
  useEffect(() => { setPage(1); }, [sortBy, sortDir, statusFilter, categoryFilter, search]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["tickets", sortBy, sortDir, page, statusFilter, categoryFilter, search],
    queryFn: () => fetchTickets(sortBy, sortDir, page, statusFilter, categoryFilter, search || undefined),
  });

  const tickets    = data?.data  ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
    <div className="p-6 mx-auto max-w-7xl">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>Tickets</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
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
          {!isPending && !isError && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {total === 0
                  ? "No tickets"
                  : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  aria-label="First page"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  aria-label="Last page"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
