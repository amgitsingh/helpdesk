import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { type TicketDetail, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

async function fetchTicket(id: string): Promise<TicketDetail> {
  const { data } = await axios.get<TicketDetail>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return data;
}

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

const SENDER_LABEL: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
  ai: "AI",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-4">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {isPending && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">Failed to load ticket.</p>
          </CardContent>
        </Card>
      )}

      {ticket && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={STATUS_CONFIG[ticket.status].className}>
                  {STATUS_CONFIG[ticket.status].label}
                </span>
                {ticket.category && (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[ticket.category]}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm mb-6">
                <dt className="text-muted-foreground">From</dt>
                <dd>{ticket.senderName} &lt;{ticket.senderEmail}&gt;</dd>

                <dt className="text-muted-foreground">Assigned to</dt>
                <dd>{ticket.assignedTo?.name ?? <span className="text-muted-foreground">Unassigned</span>}</dd>

                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>

                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
              </dl>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Original message
                </p>
                <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                  {ticket.body}
                </div>
              </div>
            </CardContent>
          </Card>

          {(ticket.aiSummary || ticket.aiSuggestedReply) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.aiSummary && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Summary
                    </p>
                    <p className="text-sm">{ticket.aiSummary}</p>
                  </div>
                )}
                {ticket.aiSuggestedReply && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Suggested reply
                    </p>
                    <div className="rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                      {ticket.aiSuggestedReply}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {ticket.messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.messages.map((msg) => (
                  <div key={msg.id} className="rounded-md border p-4 text-sm space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {msg.user?.name ?? SENDER_LABEL[msg.sender] ?? msg.sender}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-muted-foreground">{msg.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
