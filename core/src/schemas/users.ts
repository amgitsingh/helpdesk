import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  // Empty string means "leave password unchanged"
  password: z
    .string()
    .trim()
    .refine(val => val === '' || val.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
