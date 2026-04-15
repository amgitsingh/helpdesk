import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { type TicketDetail, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Card, CardContent } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { TicketInfo } from "@/components/tickets/TicketInfo";
import { TicketDetailSkeleton } from "@/components/tickets/TicketDetailSkeleton";
import { MessageThread } from "@/components/tickets/MessageThread";
import { ReplyForm } from "@/components/tickets/ReplyForm";
import { TicketSummary } from "@/components/tickets/TicketSummary";

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

async function postReply(ticketId: string, body: string): Promise<void> {
  await axios.post(`/api/tickets/${ticketId}/messages`, { body }, { withCredentials: true });
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [replyKey, setReplyKey] = useState(0);

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

  const replyMutation = useMutation({
    mutationFn: (body: string) => postReply(id!, body),
    onSuccess: () => {
      setReplyKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
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
      <BackLink to="/tickets" label="Back to tickets" />

      {isPending && <TicketDetailSkeleton />}

      {isError && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">Failed to load ticket.</p>
          </CardContent>
        </Card>
      )}

      {ticket && (
        <>
          <TicketInfo
            ticket={ticket}
            agents={agents}
            isUpdating={updateMutation.isPending}
            onAssignChange={handleAssignChange}
            onStatusChange={handleStatusChange}
            onCategoryChange={handleCategoryChange}
          />
          <TicketSummary ticketId={id!} summary={ticket.aiSummary} />
          <MessageThread messages={ticket.messages} />
          <ReplyForm
            key={replyKey}
            ticketId={id!}
            onSubmit={(body) => replyMutation.mutate(body)}
            isPending={replyMutation.isPending}
            isError={replyMutation.isError}
          />
        </>
      )}
    </div>
  );
}
