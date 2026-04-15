import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
  onSubmit: (body: string) => void;
  isPending: boolean;
  isError: boolean;
}

export function ReplyForm({ onSubmit, isPending, isError }: ReplyFormProps) {
  const [body, setBody] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

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
            disabled={isPending}
            aria-label="Reply body"
            rows={4}
          />
          {isError && (
            <p className="text-sm text-destructive">Failed to send reply. Please try again.</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || body.trim() === ""}>
              {isPending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
