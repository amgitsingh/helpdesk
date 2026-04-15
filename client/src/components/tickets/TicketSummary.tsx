import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function summarizeTicket(ticketId: string): Promise<void> {
  await axios.post(`/api/tickets/${ticketId}/summarize`, {}, { withCredentials: true });
}

interface TicketSummaryProps {
  ticketId: string;
  summary: string | null;
}

export function TicketSummary({ ticketId, summary }: TicketSummaryProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => summarizeTicket(ticketId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Summary</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          <Sparkles className="w-4 h-4" />
          {mutation.isPending ? "Summarizing…" : summary ? "Re-summarize" : "Summarize"}
        </Button>
      </CardHeader>
      <CardContent>
        {mutation.isError && (
          <p className="text-xs text-destructive mb-2">Failed to summarize. Please try again.</p>
        )}
        {summary ? (
          <p className="text-sm">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No summary yet. Click Summarize to generate one.</p>
        )}
      </CardContent>
    </Card>
  );
}
