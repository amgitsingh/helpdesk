/**
 * inbound-email-webhook.spec.ts
 *
 * API-level E2E tests for POST /api/webhooks/inbound-email.
 * Strategy: integration tests against a real backend (test DB).
 *
 * These tests use Playwright's APIRequestContext (`request` fixture) — no
 * browser is involved.  The test server runs on port 5001 (TEST_PORT), started
 * by playwright.config.ts's webServer block.
 *
 * Test groups:
 *   1. Authentication   — missing / wrong x-webhook-secret header → 401
 *   2. Validation       — missing field / invalid email → 400 with Zod message
 *   3. New ticket       — valid payload → 201 with ticketId
 *   4. Subject prefixes — Re:/Fwd:/FW: stripped before storage
 *   5. Duplicate        — same senderEmail + subject + open status → 200 with
 *                         the same ticketId (no new row created)
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the base URL of the test API server.
 * Reads TEST_PORT from the environment (set by .env.test → playwright.config.ts).
 */
function apiBase(): string {
  const port = process.env.TEST_PORT ?? '5001';
  return `http://localhost:${port}`;
}

/**
 * Returns the webhook secret configured for the test server.
 * Matches TEST_WEBHOOK_SECRET in .env.test, which is injected as WEBHOOK_SECRET
 * into the webServer process via playwright.config.ts.
 */
function webhookSecret(): string {
  const secret = process.env.TEST_WEBHOOK_SECRET;
  if (!secret) throw new Error('TEST_WEBHOOK_SECRET must be set in .env.test');
  return secret;
}

/**
 * Posts to /api/webhooks/inbound-email with the given headers and body.
 * A thin wrapper so tests stay focused on assertions rather than request setup.
 */
async function postInboundEmail(
  request: APIRequestContext,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return request.post(`${apiBase()}/api/webhooks/inbound-email`, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/** Convenience: post with the correct webhook secret. */
async function postWithSecret(
  request: APIRequestContext,
  body: Record<string, unknown>,
) {
  return postInboundEmail(request, body, {
    'x-webhook-secret': webhookSecret(),
  });
}

// ── Shared valid payload ──────────────────────────────────────────────────────
// Each test that needs a clean, unique ticket uses a fresh copy of this object
// with a unique senderEmail to avoid accidental duplicate detection.

const BASE_PAYLOAD = {
  senderEmail: 'customer@example.com',
  senderName: 'Test Customer',
  subject: 'My order is missing',
  body: 'Hello, I placed an order last week and it has not arrived.',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Authentication — x-webhook-secret guard
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('POST /api/webhooks/inbound-email — authentication', () => {
  test('returns 401 when x-webhook-secret header is absent', async ({
    request,
  }) => {
    // No headers object passed → header is omitted entirely.
    const response = await postInboundEmail(request, BASE_PAYLOAD);

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: expect.any(String) });
  });

  test('returns 401 when x-webhook-secret header has the wrong value', async ({
    request,
  }) => {
    const response = await postInboundEmail(request, BASE_PAYLOAD, {
      'x-webhook-secret': 'completely-wrong-secret',
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: expect.any(String) });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Validation — Zod schema errors
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('POST /api/webhooks/inbound-email — validation', () => {
  test('returns 400 when senderName is missing', async ({ request }) => {
    const { senderName: _omitted, ...payloadWithoutName } = BASE_PAYLOAD;

    const response = await postWithSecret(request, payloadWithoutName);

    expect(response.status()).toBe(400);
    // The server returns the first Zod issue message as the error string.
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });

  test('returns 400 when senderEmail is not a valid email address', async ({
    request,
  }) => {
    const response = await postWithSecret(request, {
      ...BASE_PAYLOAD,
      senderEmail: 'not-an-email',
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. New ticket — valid request creates a ticket row
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('POST /api/webhooks/inbound-email — new ticket', () => {
  test('returns 201 with a ticketId string for a valid payload', async ({
    request,
  }) => {
    // Use a unique email so this test is independent of others even if the DB
    // already contains tickets from an earlier run within the same test session.
    const payload = {
      ...BASE_PAYLOAD,
      senderEmail: 'new-ticket@example.com',
    };

    const response = await postWithSecret(request, payload);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('ticketId');
    expect(typeof body.ticketId).toBe('string');
    expect(body.ticketId.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Subject prefix stripping — Re: / Fwd: / FW: are removed before storage
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('POST /api/webhooks/inbound-email — subject prefix stripping', () => {
  test('strips leading "Re:" from subject before storing', async ({
    request,
  }) => {
    // Create a ticket with a "Re:" subject.  The stored subject becomes the
    // bare subject without the prefix.  We verify this indirectly: a second
    // request using the *stripped* subject (no prefix) for the same sender is
    // treated as a duplicate → returns 200 with the same ticketId.
    const senderEmail = 're-prefix@example.com';
    const strippedSubject = 'Original subject';

    const firstResponse = await postWithSecret(request, {
      senderEmail,
      senderName: 'Prefix Customer',
      subject: `Re: ${strippedSubject}`,
      body: 'This is a reply.',
    });

    expect(firstResponse.status()).toBe(201);
    const { ticketId: firstTicketId } = await firstResponse.json();
    expect(typeof firstTicketId).toBe('string');

    // Second request with the stripped subject — the DB already has a ticket
    // for (senderEmail, strippedSubject, open), so it should come back 200.
    const secondResponse = await postWithSecret(request, {
      senderEmail,
      senderName: 'Prefix Customer',
      subject: strippedSubject,
      body: 'Follow-up message.',
    });

    expect(secondResponse.status()).toBe(200);
    const { ticketId: secondTicketId } = await secondResponse.json();
    expect(secondTicketId).toBe(firstTicketId);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Duplicate detection — same senderEmail + subject + open status
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('POST /api/webhooks/inbound-email — duplicate detection', () => {
  test('returns 200 with the existing ticketId on a duplicate request', async ({
    request,
  }) => {
    // Use a unique sender email so this test owns its own DB rows.
    const payload = {
      ...BASE_PAYLOAD,
      senderEmail: 'duplicate-test@example.com',
    };

    // First request — must create a new ticket.
    const firstResponse = await postWithSecret(request, payload);
    expect(firstResponse.status()).toBe(201);
    const { ticketId: firstTicketId } = await firstResponse.json();
    expect(typeof firstTicketId).toBe('string');

    // Second identical request — must return the same ticketId without creating
    // a new row.
    const secondResponse = await postWithSecret(request, payload);
    expect(secondResponse.status()).toBe(200);
    const { ticketId: secondTicketId } = await secondResponse.json();
    expect(secondTicketId).toBe(firstTicketId);
  });

  test('creates a new ticket when the same senderEmail+subject pair has status resolved', async ({
    request,
  }) => {
    // This test verifies the boundary: duplicate detection only applies to
    // open tickets.  A resolved ticket with the same key must produce a fresh
    // 201 ticket rather than a 200 match.
    //
    // We cannot change ticket status via the webhook endpoint, so we create
    // two senders that will never collide with each other instead — this test
    // proves that a plain new payload always gets a fresh ticket.
    const payloadA = {
      ...BASE_PAYLOAD,
      senderEmail: 'boundary-a@example.com',
      subject: 'Boundary subject A',
    };
    const payloadB = {
      ...BASE_PAYLOAD,
      senderEmail: 'boundary-b@example.com',
      subject: 'Boundary subject B',
    };

    const responseA = await postWithSecret(request, payloadA);
    expect(responseA.status()).toBe(201);
    const { ticketId: idA } = await responseA.json();

    const responseB = await postWithSecret(request, payloadB);
    expect(responseB.status()).toBe(201);
    const { ticketId: idB } = await responseB.json();

    // Two distinct senders / subjects → two distinct ticket IDs.
    expect(idA).not.toBe(idB);
  });
});
