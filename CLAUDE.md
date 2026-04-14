# Helpdesk — Project Memory

## What This Project Is
An AI-powered ticket management system. Support emails are ingested, classified, summarised, and replied to using Claude AI. Agents manage tickets via a web dashboard.

## Monorepo Structure
```
helpdesk/
├── core/     # Shared TypeScript — Zod schemas, inferred types (package: @helpdesk/core)
├── client/   # React + TypeScript + Vite + React Router + Tailwind CSS v4 + shadcn/ui
├── server/   # Node.js + Express + TypeScript
├── e2e/      # Playwright end-to-end tests
```

## Tech Stack
- **Frontend:** React 18, TypeScript, React Router v6, Tailwind CSS v4, shadcn/ui (base-nova, neutral), TanStack Query, axios
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

## Key Conventions
- All API routes are prefixed with `/api`
- Vite proxies `/api/*` to `http://localhost:${API_PORT ?? 5000}` — no CORS issues in dev
- Environment variables live in `.env` (copy from `.env.example`)
- Server entry point: `server/src/index.ts`
- Client entry point: `client/src/main.tsx`

## Domain Model
- **Ticket** — status: `open | resolved | closed` — category: `General Question | Technical Question | Refund Request`
- **Message** — belongs to a ticket, sender is `agent | ai | customer`
- **User** — role: `admin | agent`; system is seeded with one admin on deploy; users created via the API always get `Role.agent` — import `Role` from `server/src/generated/prisma/client`

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

Nav links visible only to admins: check `session?.user.role === Role.admin` inline in `Layout.tsx`.

### Env vars required
- `BETTER_AUTH_URL` — server base URL (e.g. `http://localhost:5000`)
- `BETTER_AUTH_SECRET` — random secret string, **minimum 32 characters** (validated at startup)
- `CLIENT_URL` — client origin for CORS (e.g. `http://localhost:5173`)
- `DATABASE_URL` — PostgreSQL connection string (validated at startup)
- Startup guard in `server/src/index.ts` exits the process if any required env var is missing or the secret is too short

## Backend Conventions
- **Express 5** is used — async route handlers that throw (or return a rejected promise) are automatically forwarded to the error handler. **Do not wrap route handlers in try/catch** unless you need to handle a specific error locally.

## Role Enum
- The `Role` const and type live in `core/src/enums.ts` and are exported from `@helpdesk/core`
- **Always import `Role` from `@helpdesk/core`** — never use magic strings `"admin"` or `"agent"` anywhere in the client or server
- Usage: `import { Role } from '@helpdesk/core'` → `Role.admin`, `Role.agent`
- The server also has a `Role` enum in `server/src/generated/prisma/client` — use the Prisma one only inside Prisma calls; for all other logic (route guards, middleware, comparisons) use the `@helpdesk/core` one

## Shared Schemas (`core` package)
- All Zod schemas that are used by **both** client and server live in `core/src/schemas/` and are exported from `core/src/index.ts`
- Import them in either workspace as `import { mySchema, type MyInput } from '@helpdesk/core'`
- The `core` package ships TypeScript source directly (no build step) — Vite and ts-node both resolve it via the `"main"` field in `core/package.json`
- Always export the inferred type alongside the schema: `export type MyInput = z.infer<typeof mySchema>`
- Schemas that are only used in one workspace can stay local to that workspace

## Backend Validation
- Use **Zod** for all request body validation in API routes — prefer schemas from `@helpdesk/core` when the same schema is needed on the client
- Use the `parseBody` utility (`server/src/utils/parseBody.ts`) to validate request bodies — it calls `schema.safeParse`, sends a `400` with `result.error.issues[0].message` on failure, and returns `null` so the route can `return` early:
  ```ts
  const data = parseBody(mySchema, req.body, res);
  if (!data) return;
  ```

## Security
- `helmet` is applied as the first middleware in `server/src/app.ts` (sets X-Frame-Options, HSTS, CSP, etc.)
- `/api/health` returns `{ status: 'ok' }` only — does not expose implementation details
- `seed.ts` fails fast if `SEED_EMAIL` or `SEED_PASSWORD` are not set — no hardcoded fallback credentials

## Frontend Notes
- **Tailwind v4** — integrated via `@tailwindcss/vite` plugin (not PostCSS). CSS vars mapped to utilities via `@theme inline` in `index.css`.
- **shadcn/ui** — components in `client/src/components/ui/`. Add via `npx shadcn@latest add <component>` from `client/`. Path alias `@/` → `src/`.
- **Forms** — use `defaultValues` in every `useForm` call (Zod v4 rejects `undefined` for string fields). Input component uses `React.forwardRef` for react-hook-form ref compatibility.
- **Data fetching** — use **TanStack Query** (`useQuery`, `useMutation`) for all server state. Use **axios** for HTTP calls (installed in client). Always pass `withCredentials: true` to axios so cookies are sent. Never use raw `fetch` for API calls.

## Testing Strategy
**Default: write unit tests.** Write E2E tests only for flows that require a real browser, real auth session, or multi-step user journeys (e.g. create → verify in UI). Pure rendering, data fetching, and logic belong in unit tests.

**When to write unit tests (always):**
- Every new component or page gets a co-located unit test on creation
- Cover: loading state, error state, empty state, data rendering, enum-driven output (badges, labels)

**When to write E2E tests (only when needed):**
- Full user journeys that span multiple pages or require real auth cookies
- Flows that cannot be meaningfully tested without a running server + DB (e.g. CRUD verified in the UI end-to-end)
- Do NOT duplicate what unit tests already cover — E2E tests should test the integration, not re-test rendering details

### Unit Tests (Vitest + React Testing Library)
- **Framework:** Vitest + React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`)
- **Test files:** co-located with the component, e.g. `src/pages/TicketsPage.test.tsx`
- **Run tests:** `npm test --workspace=client` (single run) · `npm run test:watch --workspace=client` (watch mode)
- **Test environment:** jsdom, pool: vmThreads (required for Windows compatibility)
- **Shared utilities:** `src/test/renderWithClient.tsx` — wraps UI in a fresh `QueryClient`; import via `@/test/renderWithClient`. Use this for any component that uses TanStack Query.
- **Mocking axios:** use `vi.mock('axios')` + `vi.mocked(axios)` at the top of the test file; mock `axios.get` per test
- **Query client config:** always set `retry: false` in test `QueryClient` to prevent retries from slowing tests down
- **Setup file:** `src/test/setup.ts` — imports `@testing-library/jest-dom` matchers globally; already wired up via `vite.config.ts`

### E2E Tests (Playwright)
- Delegate to the **e2e-test-writer** agent — do not write Playwright tests directly
- Infrastructure: `e2e/fixtures/auth.ts` (adminTest / agentTest fixtures), `e2e/pages/` (POMs), `e2e/global-setup.ts` (DB reset + seed)

## Agents
- **Context7** (`use context7`) — fetches up-to-date library documentation. Use this before writing code that depends on a specific library to get the latest API and avoid using deprecated patterns.
- **e2e-test-writer** — writes Playwright E2E tests. Only invoke when E2E tests are warranted (see Testing Strategy above). Do not write Playwright tests directly; always delegate to this agent. It knows the full test infrastructure (ports, env vars, global setup, auth fixtures, POM conventions).
