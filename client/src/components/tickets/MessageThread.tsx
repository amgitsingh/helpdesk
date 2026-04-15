import { type TicketMessage } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MessageThreadProps {
  messages: TicketMessage[];
}

const SENDER_LABEL: Record<string, string> = {
  customer: "Customer",
  agent: "Agent",
  ai: "AI",
};

const MESSAGE_STYLE: Record<string, { bubble: string; wrapper: string }> = {
  customer: {
    wrapper: "items-start",
    bubble: "bg-muted/40 border",
  },
  agent: {
    wrapper: "items-end",
    bubble: "bg-primary/10 border border-primary/20",
  },
  ai: {
    wrapper: "items-end",
    bubble: "bg-violet-50 border border-violet-200",
  },
};

export function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.map((msg) => {
          const style = MESSAGE_STYLE[msg.sender] ?? MESSAGE_STYLE.customer;
          const senderName = msg.user?.name ?? SENDER_LABEL[msg.sender] ?? msg.sender;
          return (
            <div key={msg.id} className={`flex flex-col ${style.wrapper}`}>
              <div className={`rounded-md p-4 text-sm space-y-1 max-w-[80%] ${style.bubble}`}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{senderName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.sentAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-muted-foreground">{msg.body}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
