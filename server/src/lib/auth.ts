import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma';
import { Role } from '../generated/prisma/client';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.CLIENT_URL ?? 'http://localhost:5173'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 10,
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: Role.agent,
        input: false,
      },
    },
  },
});
