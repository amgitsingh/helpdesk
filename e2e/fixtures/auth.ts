import { test as base, type Page } from '@playwright/test';
import path from 'path';

/**
 * Resolved paths for pre-saved storage states.
 * global-setup.ts writes these files by logging in through the UI.
 */
export const STORAGE_STATE = {
  admin: path.resolve(__dirname, '../.auth/admin.json'),
  agent: path.resolve(__dirname, '../.auth/agent.json'),
} as const;

// ── Typed test credentials (read from env, never hardcoded) ──────────────────

export function getAdminCredentials(): { email: string; password: string } {
  const email = process.env.TEST_SEED_EMAIL;
  const password = process.env.TEST_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'TEST_SEED_EMAIL / TEST_SEED_PASSWORD must be set in .env.test',
    );
  }
  return { email, password };
}

export function getAgentCredentials(): { email: string; password: string } {
  return {
    email: process.env.TEST_AGENT_EMAIL ?? 'agent@test.helpdesk.local',
    password: process.env.TEST_AGENT_PASSWORD ?? 'TestAgent@Playwright1',
  };
}

// ── Extended test fixtures ────────────────────────────────────────────────────

type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * `adminTest` — every test in a suite that imports this already has an active
 * admin session loaded from the storageState file written in global-setup.ts.
 * No re-login per test.
 *
 * Usage:
 *   import { adminTest as test } from '../fixtures/auth';
 *   test('admin sees Users link', async ({ page }) => { ... });
 */
export const adminTest = base.extend<AuthFixtures>({
  // Override the default context so it carries the admin storageState.
  // Playwright supports returning a new context from the `context` fixture.
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE.admin,
    });
    await use(context);
    await context.close();
  },
  // The `page` fixture is derived from `context`, so overriding `context`
  // is enough — `page` will automatically open in the authenticated context.
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * `agentTest` — same pattern but for an agent-role user.
 */
export const agentTest = base.extend<AuthFixtures>({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE.agent,
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});
