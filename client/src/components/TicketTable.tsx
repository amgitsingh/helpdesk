import { Ticket, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  [TicketStatus.open]: {
    label: "Open",
    className: "inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
  },
  [TicketStatus.resolved]: {
    label: "Resolved",
    className: "inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700",
  },
  [TicketStatus.closed]: {
    label: "Closed",
    className: "inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
  },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General Question",
  [TicketCategory.technical_question]: "Technical Question",
  [TicketCategory.refund_request]: "Refund Request",
};

type Props = {
  tickets: Ticket[];
  isPending: boolean;
  isError: boolean;
};

export function TicketTable({ tickets, isPending, isError }: Props) {
  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-1/3 h-5" />
            <Skeleton className="w-1/4 h-5" />
            <Skeleton className="w-16 h-5" />
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-20 h-5" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive">Failed to load tickets.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Sender</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
              No tickets found.
            </TableCell>
          </TableRow>
        ) : (
          tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.subject}</TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.senderName}{" "}
                <span className="text-xs">{"<"}{ticket.senderEmail}{">"}</span>
              </TableCell>
              <TableCell>
                <span className={STATUS_CONFIG[ticket.status].className}>
                  {STATUS_CONFIG[ticket.status].label}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.category ? CATEGORY_LABELS[ticket.category] : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
