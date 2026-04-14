import { z } from 'zod';

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
