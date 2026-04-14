import { z } from 'zod';
import { TicketStatus, TicketCategory } from '../constants/tickets';

export const TICKET_SORT_FIELDS = [
  'subject',
  'senderName',
  'senderEmail',
  'status',
  'category',
  'createdAt',
] as const;

export type TicketSortField = (typeof TICKET_SORT_FIELDS)[number];

export const ticketSortSchema = z.object({
  sortBy: z.enum(TICKET_SORT_FIELDS).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type TicketSort = z.infer<typeof ticketSortSchema>;

export const ticketFilterSchema = z.object({
  status:   z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  search:   z.string().optional(),
});

export type TicketFilter = z.infer<typeof ticketFilterSchema>;

export type Ticket = {
  id: string;
  subject: string;
  senderEmail: string;
  senderName: string;
  status: TicketStatus;
  category: TicketCategory | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
};

export const inboundEmailSchema = z.object({
  senderEmail: z.string().email(),
  senderName: z.string().trim().min(1),
  subject: z
    .string()
    .trim()
    .min(1)
    .transform(s => {
      const prefix = /^(re|fwd?|fw):\s*/i;
      while (prefix.test(s)) s = s.replace(prefix, '').trim();
      return s;
    })
    .pipe(z.string().min(1, 'Subject must not be empty after removing prefixes')),
  body: z.string().min(1),
});

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
