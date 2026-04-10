import { execSync } from 'child_process';
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const serverDir = path.resolve(__dirname, '../server');

// ---------------------------------------------------------------------------
// Helper — POST to better-auth's sign-in endpoint and save Playwright
// storageState so individual test suites can skip re-logging in.
// ---------------------------------------------------------------------------
async function saveStorageState(
  email: string,
  password: string,
  outputPath: string,
): Promise<void> {
  const clientUrl = process.env.TEST_CLIENT_URL ?? 'http://localhost:5174';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the login page and sign in through the UI so that the
  // browser context accumulates the same cookies/localStorage that a real
  // user session would have.
  await page.goto(`${clientUrl}/login`);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait until we land on the home page — confirms the session is active.
  await page.waitForURL(`${clientUrl}/`, { timeout: 15_000 });

  await context.storageState({ path: outputPath });
  await browser.close();
}

export default async function globalSetup() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error('TEST_DATABASE_URL is not set in .env.test');

  const seedEmail = process.env.TEST_SEED_EMAIL;
  const seedPassword = process.env.TEST_SEED_PASSWORD;
  const seedName = process.env.TEST_SEED_NAME ?? 'Test Admin';
  if (!seedEmail || !seedPassword) {
    throw new Error('TEST_SEED_EMAIL and TEST_SEED_PASSWORD must be set in .env.test');
  }

  const agentEmail = process.env.TEST_AGENT_EMAIL ?? 'agent@test.helpdesk.local';
  const agentPassword = process.env.TEST_AGENT_PASSWORD ?? 'TestAgent@Playwright1';
  const agentName = process.env.TEST_AGENT_NAME ?? 'Test Agent';

  // ── 1. Reset the test database and apply all migrations from scratch ──────
  execSync('npx prisma migrate reset --force', {
    cwd: serverDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  // ── 2. Seed the test admin user ───────────────────────────────────────────
  execSync('npm run seed', {
    cwd: serverDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SEED_EMAIL: seedEmail,
      SEED_PASSWORD: seedPassword,
      SEED_NAME: seedName,
    },
    stdio: 'inherit',
  });

  // ── 3. Seed the test agent user (role: agent) ────────────────────────────
  // seed-agent.ts creates a user with Role.agent directly (unlike seed.ts
  // which always creates an admin).
  execSync('npm run seed:agent', {
    cwd: serverDir,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      SEED_EMAIL: agentEmail,
      SEED_PASSWORD: agentPassword,
      SEED_NAME: agentName,
    },
    stdio: 'inherit',
  });

  // ── 4. Persist auth session for both users ────────────────────────────────
  // Ensure the .auth directory exists.
  const authDir = path.resolve(__dirname, '.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  await saveStorageState(
    seedEmail,
    seedPassword,
    path.join(authDir, 'admin.json'),
  );

  await saveStorageState(
    agentEmail,
    agentPassword,
    path.join(authDir, 'agent.json'),
  );
}
