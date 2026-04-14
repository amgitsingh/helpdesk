import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { type TicketDetail, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

type Agent = { id: string; name: string };

async function fetchTicket(id: string): Promise<TicketDetail> {
  const { data } = await axios.get<TicketDetail>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return data;
}

async function fetchAgents(): Promise<Agent[]> {
  const { data } = await axios.get<Agent[]>("/api/users/agents", {
    withCredentials: true,
  });
  return data;
}

async function updateTicket(
  ticketId: string,
  patch: { assignedToId?: string | null; status?: string; category?: string | null },
): Promise<void> {
  await axios.patch(`/api/tickets/${ticketId}`, patch, { withCredentials: true });
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
  const queryClient = useQueryClient();

  const { data: ticket, isPending, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: { assignedToId?: string | null; status?: string; category?: string | null }) =>
      updateTicket(id!, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });

  function handleAssignChange(value: string) {
    updateMutation.mutate({ assignedToId: value === "" ? null : value });
  }

  function handleStatusChange(value: string) {
    updateMutation.mutate({ status: value as TicketStatus });
  }

  function handleCategoryChange(value: string) {
    updateMutation.mutate({ category: value === "" ? null : value as TicketCategory });
  }

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
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
                {/* Left column: static info */}
                <div className="space-y-3">
                  <div>
                    <dt className="text-muted-foreground mb-0.5">From</dt>
                    <dd>{ticket.senderName} &lt;{ticket.senderEmail}&gt;</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Created</dt>
                    <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Updated</dt>
                    <dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
                  </div>
                </div>

                {/* Right column: all selects */}
                <div className="space-y-3">
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Assigned to</dt>
                    <dd>
                      <Select value={ticket.assignedTo?.id ?? ""} onValueChange={handleAssignChange}>
                        <SelectTrigger className="w-48 h-7 text-xs" aria-label="Assign agent" disabled={updateMutation.isPending}>
                          <span className={ticket.assignedTo ? undefined : "text-muted-foreground"}>
                            {ticket.assignedTo?.name ?? "Unassigned"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Status</dt>
                    <dd>
                      <Select value={ticket.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-48 h-7 text-xs" aria-label="Update status" disabled={updateMutation.isPending}>
                          <span>{STATUS_CONFIG[ticket.status].label}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TicketStatus.open}>Open</SelectItem>
                          <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                          <SelectItem value={TicketStatus.closed}>Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-0.5">Category</dt>
                    <dd>
                      <Select value={ticket.category ?? ""} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-48 h-7 text-xs" aria-label="Update category" disabled={updateMutation.isPending}>
                          <span className={ticket.category ? undefined : "text-muted-foreground"}>
                            {ticket.category ? CATEGORY_LABELS[ticket.category] : "No category"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No category</SelectItem>
                          <SelectItem value={TicketCategory.general_question}>General Question</SelectItem>
                          <SelectItem value={TicketCategory.technical_question}>Technical Question</SelectItem>
                          <SelectItem value={TicketCategory.refund_request}>Refund Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </dd>
                  </div>
                </div>
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
