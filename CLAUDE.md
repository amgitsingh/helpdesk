# Helpdesk — Project Memory

## What This Project Is
An AI-powered ticket management system. Support emails are ingested, classified, summarised, and replied to using Claude AI. Agents manage tickets via a web dashboard.

## Monorepo Structure
```
helpdesk/
├── client/   # React + TypeScript + Vite + React Router + Tailwind CSS v4 + shadcn/ui
├── server/   # Node.js + Express + TypeScript
├── e2e/      # Playwright end-to-end tests
```

## Tech Stack
- **Frontend:** React 18, TypeScript, React Router v6, Tailwind CSS v4, shadcn/ui (base-nova, neutral)
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** better-auth
- **AI:** Claude API (Anthropic) — classification, summaries, suggested replies
- **Email:** SendGrid or Mailgun (inbound webhook + outbound sending)
- **Deployment:** Docker on Railway
- **E2E Testing:** Playwright

## Running Locally
```bash
npm install          # install all workspace dependencies
npm run dev          # start both server (port 5000) and client (port 5173)
npm run dev:server   # server only
npm run dev:client   # client only
```

## E2E Testing (Playwright)
```bash
npm run test:e2e         # run all tests (headless)
npm run test:e2e:ui      # open Playwright UI mode
npm run test:e2e:report  # view last HTML report
```

- Tests live in `e2e/tests/`
- Config: `playwright.config.ts` (root)
- Env vars: `.env.test` (root) — loaded by playwright.config.ts via dotenv
- **Test server runs on port 5001** to avoid conflicts with the dev server (port 5000)
- **Test database:** `helpdesk_test` — completely separate from the dev DB
- `e2e/global-setup.ts` — runs `prisma migrate reset --force` then seeds a fresh admin on every test run
- `e2e/global-teardown.ts` — no-op (reset happens at start of each run)
- Playwright passes `NODE_ENV=test` and test DB credentials to the server webServer; dotenv does not override already-set env vars
- Vite proxy target reads `API_PORT` env var (defaults to `5000`); Playwright sets `API_PORT=5001` for the client webServer

### Test env vars (`.env.test`)
| Variable | Purpose |
|---|---|
| `TEST_DATABASE_URL` | Connection string for `helpdesk_test` |
| `TEST_PORT` | Server port for test runs (`5001`) |
| `TEST_BETTER_AUTH_SECRET` | Auth secret for test server (min 32 chars) |
| `TEST_BETTER_AUTH_URL` | Server base URL for test (`http://localhost:5001`) |
| `TEST_CLIENT_URL` | Client origin for CORS in test |
| `TEST_SEED_EMAIL` | Admin email seeded into test DB |
| `TEST_SEED_PASSWORD` | Admin password seeded into test DB |
| `TEST_SEED_NAME` | Admin display name |

## Key Conventions
- All API routes are prefixed with `/api`
- Vite proxies `/api/*` to `http://localhost:${API_PORT ?? 5000}` — no CORS issues in dev
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
- Rate limiting: enabled only when `NODE_ENV === 'production'` (10 req / 60 s per IP)
- Protect routes with the `requireAuth` middleware (`server/src/middleware/requireAuth.ts`)
  - Calls `auth.api.getSession()` and attaches session to `res.locals.session`
  - Returns 401 if no valid session
- Protect admin-only routes with `requireAdmin` middleware (`server/src/middleware/requireAdmin.ts`)
  - Must come **after** `requireAuth` (reads `res.locals.session` set by it)
  - Returns 403 if `session.user.role !== 'admin'`
  - **Every admin API route must use both:** `requireAuth, requireAdmin`
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
- `BETTER_AUTH_SECRET` — random secret string, **minimum 32 characters** (validated at startup)
- `CLIENT_URL` — client origin for CORS (e.g. `http://localhost:5173`)
- `DATABASE_URL` — PostgreSQL connection string (validated at startup)
- Startup guard in `server/src/index.ts` exits the process if any required env var is missing or the secret is too short

## Security
- `helmet` is applied as the first middleware in `server/src/app.ts` (sets X-Frame-Options, HSTS, CSP, etc.)
- `/api/health` returns `{ status: 'ok' }` only — does not expose implementation details
- `seed.ts` fails fast if `SEED_EMAIL` or `SEED_PASSWORD` are not set — no hardcoded fallback credentials

## Frontend Notes
- **Tailwind v4** — integrated via `@tailwindcss/vite` plugin (not PostCSS). CSS vars mapped to utilities via `@theme inline` in `index.css`.
- **shadcn/ui** — components in `client/src/components/ui/`. Add via `npx shadcn@latest add <component>` from `client/`. Path alias `@/` → `src/`.
- **Forms** — use `defaultValues` in every `useForm` call (Zod v4 rejects `undefined` for string fields). Input component uses `React.forwardRef` for react-hook-form ref compatibility.

## MCP Tools
- **Context7** (`use context7`) — fetches up-to-date library documentation. Use this before writing code that depends on a specific library to get the latest API and avoid using deprecated patterns.
