import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type Ticket } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketTable } from "@/components/TicketTable";

async function fetchTickets(): Promise<Ticket[]> {
  const { data } = await axios.get<Ticket[]>("/api/tickets", { withCredentials: true });
  return data;
}

export default function TicketsPage() {
  const { data: tickets = [], isPending, isError } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  return (
    <div className="max-w-5xl p-6 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketTable tickets={tickets} isPending={isPending} isError={isError} />
        </CardContent>
      </Card>
    </div>
  );
}
