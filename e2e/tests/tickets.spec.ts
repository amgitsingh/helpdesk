/**
 * tickets.spec.ts
 *
 * E2E tests for the Ticket List page (/tickets).
 * Strategy: integration tests against a real backend (test DB).
 *
 * Kept tests are ones that cannot be covered by unit tests:
 *   - Nav visibility requires a real authenticated session + Layout render
 *   - "Read with data" tests validate the webhook→DB→UI pipeline end-to-end
 *   - Access-control tests require a real session with a specific role
 *
 * Rendering details (headings, column headers, empty-state copy, date
 * formatting, null-category display) are covered by TicketsPage unit tests
 * and must NOT be duplicated here.
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
// 1. Nav visibility — requires a real authenticated session
// ═════════════════════════════════════════════════════════════════════════════

adminTest.describe('Tickets page — Nav', () => {
  adminTest('"Tickets" nav link is visible in the navbar', async ({ page }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    await expect(ticketsPage.ticketsNavLink).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Read with data — validates the full webhook → DB → UI pipeline
//
// These tests create real tickets via the webhook and verify they appear in
// the UI. They cannot be unit tested because they exercise the real DB.
// ═════════════════════════════════════════════════════════════════════════════

adminTest.describe('Tickets page — Read with data', () => {
  adminTest.beforeAll(async () => {
    await createTicketViaWebhook(TICKET_OLDER);
    await createTicketViaWebhook(TICKET_NEWER);
  });

  adminTest('ticket row appears with subject, sender name, sender email, and "Open" status', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    const newerRow = ticketsPage.rowByText(TICKET_NEWER.subject);
    await expect(newerRow).toBeVisible();
    await expect(newerRow).toContainText(TICKET_NEWER.senderName);
    await expect(newerRow).toContainText(TICKET_NEWER.senderEmail);
    await expect(newerRow).toContainText('Open');
  });

  adminTest('tickets are sorted newest-first (second-created ticket appears before first)', async ({
    page,
  }) => {
    const ticketsPage = new TicketsPage(page);
    await ticketsPage.goto();

    const rows = ticketsPage.dataRows();
    await expect(rows.first()).toContainText(TICKET_NEWER.subject);
    await expect(rows.nth(1)).toContainText(TICKET_OLDER.subject);
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

    await expect(ticketsPage.heading).toBeVisible();
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

    await expect(
      page.getByRole('link', { name: 'Users', exact: true }),
    ).not.toBeVisible();
  });
});
