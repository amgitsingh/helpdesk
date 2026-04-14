/**
 * tickets.spec.ts
 *
 * E2E tests for the Ticket List page (/tickets).
 * Strategy: integration tests against a real backend (test DB).
 *
 * global-setup.ts resets the test DB before every run and seeds exactly two
 * users:
 *   - admin  — TEST_SEED_EMAIL / TEST_SEED_PASSWORD  (role: admin)
 *   - agent  — TEST_AGENT_EMAIL / TEST_AGENT_PASSWORD (role: agent)
 *
 * NO tickets are seeded.  The "Read with data" group creates tickets in
 * beforeAll via POST /api/webhooks/inbound-email so that we have real rows
 * to assert against, while still running against the live backend.
 *
 * Test groups:
 *   1. Read — empty state                  (adminTest, no tickets)
 *   2. Read with data — table rows         (adminTest, tickets created in beforeAll)
 *   3. Access control — agent can access   (agentTest)
 */

import { expect, request as playwrightRequest } from '@playwright/test';
import { adminTest, agentTest } from '../fixtures/auth';
import { TicketsPage } from '../pages/TicketsPage';

// ── Webhook helpers ───────────────────────────────────────────────────────────

function apiBase(): string {
  const port = process.env.TEST_PORT ?? '5001';
  return `http://localhost:${port}`;
}

function webhookSecret(): string {
  const secret = process.env.TEST_WEBHOOK_SECRET;
  if (!secret) throw new Error('TEST_WEBHOOK_SECRET must be set in .env.test');
  return secret;
}

interface WebhookPayload {
  senderEmail: string;
  senderName: string;
  subject: string;
  body: string;
}

/**
 * Creates a ticket via the inbound-email webhook and returns the ticketId.
 * Uses a fresh APIRequestContext so it is independent of any browser context.
 */
async function createTicketViaWebhook(payload: WebhookPayload): Promise<string> {
  const ctx = await playwrightRequest.newContext();
  try {
    const response = await ctx.post(
      `${apiBase()}/api/webhooks/inbound-email`,
      {
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret(),
        },
      },
    );
    if (response.status() !== 201) {
      throw new Error(
        `Webhook returned ${response.status()} — expected 201.\n${await response.text()}`,
      );
    }
    const body = await response.json();
    return body.ticketId as string;
  } finally {
    await ctx.dispose();
  }
}

// ── Test data ─────────────────────────────────────────────────────────────────

// Two tickets used in "Read with data" — distinct senders and subjects so
// duplicate-detection never merges them.
const TICKET_OLDER = {
  senderEmail: 'older-customer@example.com',
  senderName: 'Older Customer',
  subject: 'My order has not arrived yet',
  body: 'I placed an order two weeks ago and it still has not arrived.',
} as const;

const TICKET_NEWER = {
  senderEmail: 'newer-customer@example.com',
  senderName: 'Newer Customer',
  subject: 'Request a refund for damaged item',
  body: 'The item I received was damaged. Please process a refund.',
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// 1. Read — page renders correctly with an empty ticket list
// ═════════════════════════════════════════════════════════════════════════════

adminTest.describe('Tickets page — Read (empty state)', () => {
  adminTest('shows the page heading "Tickets"', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(ticketsPage.heading).toBeVisible();
  });

  adminTest('renders the expected table column headers', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    const headers = page.getByRole('columnheader');
    await expect(headers.filter({ hasText: 'Subject' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Sender' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Status' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Category' })).toBeVisible();
    await expect(headers.filter({ hasText: 'Created' })).toBeVisible();
  });

  adminTest('"Tickets" nav link is visible in the navbar', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(ticketsPage.ticketsNavLink).toBeVisible();
  });

  adminTest('shows the empty state message when no tickets exist', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(ticketsPage.emptyState).toBeVisible();
    // The table still renders — it just has one colSpan row.
    await expect(ticketsPage.table).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Read with data — ticket rows appear and are sorted newest-first
//
// Two tickets are created in beforeAll so every test in this group has data.
// We create TICKET_OLDER first, then TICKET_NEWER, to establish a clear
// newest-first ordering.
// ═════════════════════════════════════════════════════════════════════════════

adminTest.describe('Tickets page — Read with data', () => {
  adminTest.beforeAll(async () => {
    // Create the older ticket first so the DB timestamp is earlier.
    await createTicketViaWebhook(TICKET_OLDER);
    // Small gap between requests is not needed — Postgres timestamps are
    // stored with microsecond precision and each INSERT is a separate
    // transaction, so the order is deterministic.
    await createTicketViaWebhook(TICKET_NEWER);
  });

  adminTest('ticket row appears with subject, sender name, sender email, and "Open" status', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Both tickets must appear.  We verify the newer one in detail.
    const newerRow = ticketsPage.rowByText(TICKET_NEWER.subject);
    await expect(newerRow).toBeVisible();
    await expect(newerRow).toContainText(TICKET_NEWER.senderName);
    await expect(newerRow).toContainText(TICKET_NEWER.senderEmail);
    // Status badge for a newly created ticket is always "Open".
    await expect(newerRow).toContainText('Open');
  });

  adminTest('category cell shows "—" for tickets without a category (AI not run)', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Webhook-created tickets have category: null because AI classification
    // has not run yet.  The component renders "—" for null categories.
    const newerRow = ticketsPage.rowByText(TICKET_NEWER.subject);
    await expect(newerRow).toContainText('—');
  });

  adminTest('tickets are sorted newest-first (second-created ticket appears before first)', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // dataRows() returns only <tbody> rows, so index 0 is the first data row.
    const rows = ticketsPage.dataRows();

    // The newer ticket was created second — it must appear in the first row.
    await expect(rows.first()).toContainText(TICKET_NEWER.subject);
    // The older ticket was created first — it must appear in the second row.
    await expect(rows.nth(1)).toContainText(TICKET_OLDER.subject);
  });

  adminTest('Created date cell is non-empty for ticket rows', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // The Created column renders toLocaleDateString() — format varies by
    // locale so we assert the cell is not blank rather than matching a pattern.
    const newerRow = ticketsPage.rowByText(TICKET_NEWER.subject);
    // 5 cells: Subject | Sender | Status | Category | Created
    const cells = newerRow.getByRole('cell');
    await expect(cells).toHaveCount(5);
    await expect(cells.nth(4)).not.toBeEmpty();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Access control — /tickets is accessible to agents (not admin-only)
// ═════════════════════════════════════════════════════════════════════════════

agentTest.describe('Tickets page — Access control (agent)', () => {
  agentTest('agent can navigate to /tickets and see the table', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // Page heading confirms the agent landed on the tickets page (not a
    // redirect to / or /login).
    await expect(ticketsPage.heading).toBeVisible();
    // The table is always rendered, even in the empty state.
    await expect(ticketsPage.table).toBeVisible();
  });

  agentTest('"Tickets" nav link is visible for agents', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(ticketsPage.ticketsNavLink).toBeVisible();
  });

  agentTest('"Users" nav link is NOT visible for agents', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    // The Users link is admin-only — agents must not see it.
    await expect(
      page.getByRole('link', { name: 'Users', exact: true }),
    ).not.toBeVisible();
  });
});
