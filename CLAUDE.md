# Helpdesk — Project Memory

## What This Project Is
An AI-powered ticket management system. Support emails are ingested, classified, summarised, and replied to using Claude AI. Agents manage tickets via a web dashboard.

## Monorepo Structure
```
helpdesk/
├── client/   # React + TypeScript + Vite + React Router + Tailwind CSS
├── server/   # Node.js + Express + TypeScript
```

## Tech Stack
- **Frontend:** React 18, TypeScript, React Router v6, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Database-backed sessions (express-session + connect-pg-simple)
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

## MCP Tools
- **Context7** (`use context7`) — fetches up-to-date library documentation. Use this before writing code that depends on a specific library to get the latest API and avoid using deprecated patterns.
