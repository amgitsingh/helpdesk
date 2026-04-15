import { type TicketDetail, TicketStatus, TicketCategory } from "@helpdesk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type Agent = { id: string; name: string };

interface TicketInfoProps {
  ticket: TicketDetail;
  agents: Agent[];
  isUpdating: boolean;
  onAssignChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string }> = {
  [TicketStatus.open]:     { label: "Open" },
  [TicketStatus.resolved]: { label: "Resolved" },
  [TicketStatus.closed]:   { label: "Closed" },
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.general_question]:   "General Question",
  [TicketCategory.technical_question]: "Technical Question",
  [TicketCategory.refund_request]:     "Refund Request",
};

export function TicketInfo({
  ticket,
  agents,
  isUpdating,
  onAssignChange,
  onStatusChange,
  onCategoryChange,
}: TicketInfoProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 mb-6 text-sm gap-x-8 gap-y-3">
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

            <div className="space-y-3">
              <div>
                <dt className="text-muted-foreground mb-0.5">Assigned to</dt>
                <dd>
                  <Select value={ticket.assignedTo?.id ?? ""} onValueChange={onAssignChange}>
                    <SelectTrigger className="w-48 text-xs h-7" aria-label="Assign agent" disabled={isUpdating}>
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
                  <Select value={ticket.status} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-48 text-xs h-7" aria-label="Update status" disabled={isUpdating}>
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
                  <Select value={ticket.category ?? ""} onValueChange={onCategoryChange}>
                    <SelectTrigger className="w-48 text-xs h-7" aria-label="Update category" disabled={isUpdating}>
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
            <p className="mb-2 text-xs font-medium tracking-wide uppercase text-muted-foreground">
              Original message
            </p>
            <div className="p-4 text-sm whitespace-pre-wrap border rounded-md bg-muted/30">
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
                <p className="mb-1 text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  Summary
                </p>
                <p className="text-sm">{ticket.aiSummary}</p>
              </div>
            )}
            {ticket.aiSuggestedReply && (
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  Suggested reply
                </p>
                <div className="p-4 text-sm whitespace-pre-wrap border rounded-md bg-muted/30">
                  {ticket.aiSuggestedReply}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
