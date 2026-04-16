import { User, Bot, Headphones } from "lucide-react";
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

type SenderStyle = {
  bubble: string;
  wrapper: string;
  avatar: string;
  icon: React.ReactNode;
};

const MESSAGE_STYLE: Record<string, SenderStyle> = {
  customer: {
    wrapper: "items-start",
    bubble: "bg-muted/50 border border-border",
    avatar: "bg-muted border border-border text-muted-foreground",
    icon: <User size={13} strokeWidth={2} />,
  },
  agent: {
    wrapper: "items-end",
    bubble: "bg-primary/10 dark:bg-primary/15 border border-primary/20",
    avatar: "bg-primary/15 border border-primary/25 text-primary",
    icon: <Headphones size={13} strokeWidth={2} />,
  },
  ai: {
    wrapper: "items-end",
    bubble:
      "bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60",
    avatar:
      "bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700/60 text-violet-600 dark:text-violet-400",
    icon: <Bot size={13} strokeWidth={2} />,
  },
};

export function MessageThread({ messages }: MessageThreadProps) {
  if (messages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((msg) => {
          const style = MESSAGE_STYLE[msg.sender] ?? MESSAGE_STYLE.customer;
          const senderName = msg.user?.name ?? SENDER_LABEL[msg.sender] ?? msg.sender;
          const isRight = style.wrapper === "items-end";

          return (
            <div key={msg.id} className={`flex flex-col ${style.wrapper}`}>
              <div className={`flex items-start gap-2.5 max-w-[80%] ${isRight ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar icon */}
                <div
                  className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center mt-0.5 ${style.avatar}`}
                  aria-hidden
                >
                  {style.icon}
                </div>

                {/* Bubble */}
                <div className={`rounded-xl p-3.5 text-sm space-y-1.5 ${style.bubble}`}>
                  <div className={`flex items-center gap-4 ${isRight ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="font-semibold text-xs">{senderName}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(msg.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {msg.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
