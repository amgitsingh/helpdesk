# Helpdesk — Project Memory

## What This Project Is
An AI-powered ticket management system. Support emails are ingested, classified, summarised, and replied to using Claude AI. Agents manage tickets via a web dashboard.

## Monorepo Structure
```
helpdesk/
├── client/   # React + TypeScript + Vite + React Router + Tailwind CSS v4 + shadcn/ui
├── server/   # Node.js + Express + TypeScript
```

## Tech Stack
- **Frontend:** React 18, TypeScript, React Router v6, Tailwind CSS v4, shadcn/ui (base-nova, neutral)
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** better-auth
- **AI:** Claude API (Anthropic) — classification, summaries, suggested replies
- **Email:** SendGrid or Mailgun (inbound webhook + outbound sending)
- **Deployment:** Docker on Railway

## Running Locally
```bash
npm install          # install all workspace dependencies
npm run dev          # start both server (port 5000) and client (port 5173)
npm run dev:server   # server only
npm run dev:client   # client only
```

## Key Conventions
- All API routes are prefixed with `/api`
- Vite proxies `/api/*` to `http://localhost:5000` — no CORS issues in dev
- Environment variables live in `.env` (copy from `.env.example`)
- Server entry point: `server/src/index.ts`
- Client entry point: `client/src/main.tsx`

## Domain Model
- **Ticket** — status: `open | resolved | closed` — category: `General Question | Technical Question | Refund Request`
- **Message** — belongs to a ticket, sender is `agent | ai | customer`
- **User** — role: `admin | agent`; system is seeded with one admin on deploy

## Authentication (better-auth)

### Server
- Auth instance: `server/src/lib/auth.ts` — uses `prismaAdapter`, email/password only, **sign-up is disabled** (agents are created by admins)
- Auth routes: mounted at `/api/auth/*` via `toNodeHandler(auth)` — must be registered **before** `express.json()`
- Protect routes with the `requireAuth` middleware (`server/src/middleware/requireAuth.ts`)
  - Calls `auth.api.getSession()` and attaches session to `res.locals.session`
  - Returns 401 if no valid session
- User has an additional `role` field (`admin | agent`), not settable by the client

### Client
- Sign in: `authClient.signIn.email({ email, password })`
- Sign out: `authClient.signOut()`
- Session: `authClient.useSession()` — returns `{ data: session, isPending }`

### Route Protection
Wrap routes in `App.tsx` using these outlet-based guard components:

| Component | File | Redirects to | When |
|---|---|---|---|
| `<ProtectedRoute>` | `client/src/components/ProtectedRoute.tsx` | `/login` | no valid session |
| `<AdminRoute>` | `client/src/components/AdminRoute.tsx` | `/` | session exists but role ≠ `admin` |

Nesting pattern — admin routes must be inside both guards:
```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route path="/" element={<HomePage />} />          {/* any authenticated user */}
    <Route element={<AdminRoute />}>
      <Route path="/users" element={<UsersPage />} />  {/* admins only */}
    </Route>
  </Route>
</Route>
```

Nav links visible only to admins: check `session?.user.role === "admin"` inline in `Layout.tsx`.

### Env vars required
- `BETTER_AUTH_URL` — server base URL (e.g. `http://localhost:5000`)
- `BETTER_AUTH_SECRET` — random secret string
- `CLIENT_URL` — client origin for CORS (e.g. `http://localhost:5173`)

## Frontend Notes
- **Tailwind v4** — integrated via `@tailwindcss/vite` plugin (not PostCSS). CSS vars mapped to utilities via `@theme inline` in `index.css`.
- **shadcn/ui** — components in `client/src/components/ui/`. Add via `npx shadcn@latest add <component>` from `client/`. Path alias `@/` → `src/`.
- **Forms** — use `defaultValues` in every `useForm` call (Zod v4 rejects `undefined` for string fields). Input component uses `React.forwardRef` for react-hook-form ref compatibility.

## MCP Tools
- **Context7** (`use context7`) — fetches up-to-date library documentation. Use this before writing code that depends on a specific library to get the latest API and avoid using deprecated patterns.
