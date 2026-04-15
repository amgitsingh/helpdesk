import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
  ticketId: string;
  onSubmit: (body: string) => void;
  isPending: boolean;
  isError: boolean;
}

async function polishReply(ticketId: string, body: string): Promise<string> {
  const { data } = await axios.post<{ polishedBody: string }>(
    `/api/tickets/${ticketId}/polish-reply`,
    { body },
    { withCredentials: true },
  );
  return data.polishedBody;
}

export function ReplyForm({ ticketId, onSubmit, isPending, isError }: ReplyFormProps) {
  const [body, setBody] = useState("");

  const polishMutation = useMutation({
    mutationFn: (draft: string) => polishReply(ticketId, draft),
    onSuccess: (polishedBody) => setBody(polishedBody),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  const busy = isPending || polishMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reply</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write your reply..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            aria-label="Reply body"
            rows={4}
          />
          {isError && (
            <p className="text-sm text-destructive">Failed to send reply. Please try again.</p>
          )}
          {polishMutation.isError && (
            <p className="text-sm text-destructive">Failed to polish reply. Please try again.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || body.trim() === ""}
              onClick={() => polishMutation.mutate(body.trim())}
            >
              {polishMutation.isPending ? "Polishing…" : "Polish"}
            </Button>
            <Button type="submit" disabled={busy || body.trim() === ""}>
              {isPending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
