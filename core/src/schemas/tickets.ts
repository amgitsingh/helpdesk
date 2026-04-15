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

export const ticketPaginationSchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type TicketPagination = z.infer<typeof ticketPaginationSchema>;

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

export type TicketMessage = {
  id: string;
  body: string;
  sender: 'customer' | 'agent' | 'ai';
  sentAt: string;
  user: { id: string; name: string } | null;
};

export type TicketDetail = Ticket & {
  body: string;
  aiSummary: string | null;
  aiSuggestedReply: string | null;
  updatedAt: string;
  messages: TicketMessage[];
};

export type TicketPage = {
  data: Ticket[];
  total: number;
  page: number;
  pageSize: number;
};

export const ticketUpdateSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status:       z.nativeEnum(TicketStatus).optional(),
  category:     z.nativeEnum(TicketCategory).nullable().optional(),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, 'Reply cannot be empty').max(100_000),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const inboundEmailSchema = z.object({
  senderEmail: z.string().email().max(254),
  senderName: z.string().trim().min(1).max(100),
  subject: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .transform(s => {
      const prefix = /^(re|fwd?|fw):\s*/i;
      while (prefix.test(s)) s = s.replace(prefix, '').trim();
      return s;
    })
    .pipe(z.string().min(1, 'Subject must not be empty after removing prefixes')),
  body: z.string().min(1).max(1000),
});

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
