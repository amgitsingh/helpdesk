import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SortingState, type OnChangeFn } from "@tanstack/react-table";
import axios from "axios";
import { type Ticket } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/TicketTable";

async function fetchTickets(sortBy: string, sortDir: string): Promise<Ticket[]> {
  const { data } = await axios.get<Ticket[]>("/api/tickets", {
    withCredentials: true,
    params: { sortBy, sortDir },
  });
  return data;
}

export default function TicketsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const sortBy = sorting[0]?.id ?? "createdAt";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ["tickets", sortBy, sortDir],
    queryFn: () => fetchTickets(sortBy, sortDir),
  });

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setSorting((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  return (
    <div className="max-w-5xl p-6 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
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
