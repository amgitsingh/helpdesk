# Implementation Plan

## AI Powered Ticket Management System

---

## Stage 1 — Project Setup & Infrastructure

> Goal: Working local development environment with both apps running and connected.

- [ ] Initialise monorepo structure (`/client`, `/server`)
- [ ] Set up Express + TypeScript backend (`tsconfig`, `nodemon`, `ts-node`)
- [ ] Set up React + TypeScript frontend (`vite`, `tsconfig`, React Router)
- [ ] Configure ESLint and Prettier for both apps
- [ ] Write `docker-compose.yml` for local dev (backend, frontend, PostgreSQL)
- [ ] Write `Dockerfile` for backend
- [ ] Write `Dockerfile` for frontend
- [ ] Set up `.env` structure and document required variables in `.env.example`

---

## Stage 2 — Database & Data Models

> Goal: Fully defined schema with migrations and a seeded admin account.

- [ ] Install and configure Prisma in the backend
- [ ] Define schema models:
  - `User` (id, name, email, password hash, role: admin | agent, createdAt)
  - `Ticket` (id, subject, body, status: open | resolved | closed, category, source email, createdAt, updatedAt)
  - `Message` (id, ticketId, body, sender: agent | ai | customer, sentAt)
  - `Session` (for database-backed sessions)
- [ ] Run initial migration
- [ ] Write seed script to create the default admin account on first deploy

---

## Stage 3 — Authentication

> Goal: Agents and admins can log in and access protected routes.

- [ ] Install `express-session` and `connect-pg-simple` for database-backed sessions
- [ ] Implement `POST /api/auth/login` — validate credentials, create session
- [ ] Implement `POST /api/auth/logout` — destroy session
- [ ] Implement `GET /api/auth/me` — return current session user
- [ ] Write `requireAuth` middleware to protect API routes
- [ ] Write `requireAdmin` middleware for admin-only routes

---

## Stage 4 — User Management

> Goal: Admin can create and manage agent accounts via the API.

- [ ] `POST /api/users` — admin creates a new agent account
- [ ] `GET /api/users` — admin lists all agents
- [ ] `PATCH /api/users/:id` — admin updates agent details
- [ ] `DELETE /api/users/:id` — admin deactivates an agent

---

## Stage 5 — Ticket Management API

> Goal: Full CRUD for tickets with status and category support.

- [ ] `GET /api/tickets` — list tickets with filtering (status, category) and sorting (date, status)
- [ ] `GET /api/tickets/:id` — get a single ticket with its messages
- [ ] `PATCH /api/tickets/:id/status` — update ticket status (open → resolved → closed)
- [ ] `POST /api/tickets/:id/messages` — agent sends a reply on a ticket
- [ ] `DELETE /api/tickets/:id` — delete a ticket (admin only)

---

## Stage 6 — Email Ingestion

> Goal: Inbound support emails automatically create tickets in the system.

- [ ] Register inbound email webhook with SendGrid or Mailgun
- [ ] Implement `POST /api/webhooks/inbound-email` endpoint
- [ ] Parse inbound payload: extract sender, subject, and body
- [ ] Detect if email is a reply to an existing ticket (match by subject/thread ID) — if so, append as a new message; otherwise create a new ticket
- [ ] Protect webhook endpoint with a secret token

---

## Stage 7 — AI Integration

> Goal: Tickets are automatically classified, summarised, and get a suggested reply.

- [ ] Install Anthropic SDK and configure Claude API client
- [ ] On ticket creation, call Claude to classify ticket category (General Question / Technical Question / Refund Request)
- [ ] On ticket creation, call Claude to generate a short AI summary of the ticket
- [ ] On ticket creation, call Claude to generate a suggested reply using the knowledge base
- [ ] Store classification, summary, and suggested reply on the ticket record
- [ ] Set up knowledge base: create a `KnowledgeBase` table and seed with FAQ documents
- [ ] Implement basic RAG: retrieve relevant knowledge base chunks and include in Claude prompt

---

## Stage 8 — Frontend Foundation

> Goal: React app running with routing, auth, and a shared layout.

- [ ] Install and configure Tailwind CSS and shadcn/ui
- [ ] Set up React Router routes structure
- [ ] Build login page and connect to `POST /api/auth/login`
- [ ] Implement auth context — store current user, expose `login` / `logout`
- [ ] Create protected route wrapper (redirect to login if unauthenticated)
- [ ] Build shared layout: sidebar navigation, header with current user + logout

---

## Stage 9 — Frontend Ticket Management

> Goal: Agents can view, manage, and respond to tickets from the dashboard.

- [ ] Build ticket list page — table with columns: subject, category, status, date
- [ ] Add filtering controls (by status, by category) and sorting
- [ ] Build ticket detail page:
  - Display ticket subject, body, category badge, status badge
  - Display AI summary
  - Display message thread
  - Display AI suggested reply pre-filled in the reply box
  - Allow agent to edit and send the reply
- [ ] Connect status update controls (mark as resolved, close ticket)

---

## Stage 10 — Frontend User Management

> Goal: Admin can manage agents from the UI.

- [ ] Build user management page (admin only) — list all agents
- [ ] Add create agent form (name, email, password)
- [ ] Add deactivate/delete agent action

---

## Stage 11 — Dashboard & Analytics

> Goal: At-a-glance overview of ticket activity.

- [ ] Build dashboard home page with summary cards:
  - Total open tickets
  - Resolved today
  - Tickets by category breakdown
- [ ] Add recent tickets list on dashboard

---

## Stage 12 — Deployment

> Goal: Application running in production on Railway via Docker.

- [ ] Finalise production Dockerfiles (multi-stage builds for smaller images)
- [ ] Configure Railway project with backend and frontend services
- [ ] Add PostgreSQL plugin on Railway
- [ ] Set all production environment variables in Railway
- [ ] Configure DB migration step to run on deploy (`prisma migrate deploy`)
- [ ] Configure admin seed to run on first deploy
- [ ] Test end-to-end in production environment

---

## Stage Order Summary

| Stage | Focus |
|---|---|
| 1 | Project setup & Docker |
| 2 | Database schema & seed |
| 3 | Authentication |
| 4 | User management API |
| 5 | Ticket management API |
| 6 | Email ingestion |
| 7 | AI integration |
| 8 | Frontend foundation |
| 9 | Frontend tickets |
| 10 | Frontend user management |
| 11 | Dashboard & analytics |
| 12 | Deployment |
