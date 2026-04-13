/**
 * users.spec.ts
 *
 * Happy-path E2E tests for the User Management feature (/users).
 * Strategy: integration tests against a real backend (test DB).
 *
 * global-setup.ts resets the test DB before every run and seeds exactly two
 * users:
 *   - admin  — TEST_SEED_EMAIL / TEST_SEED_PASSWORD  (role: admin)
 *   - agent  — TEST_AGENT_EMAIL / TEST_AGENT_PASSWORD (role: agent)
 *
 * All tests run as the seeded admin (adminTest fixture carries the pre-saved
 * admin storageState — no re-login per test).
 *
 * Test groups:
 *   1. Read   — seeded rows appear in the table with expected columns
 *   2. Create — new user form creates a row with correct name, email, role
 *   3. Edit   — pencil button updates the user's name in the table
 *   4. Delete — trash button + confirmation removes the row from the table
 *
 * Create / Edit / Delete share a subject user.  They are grouped inside a
 * single describe block and run sequentially so that each step operates on
 * the user created by the previous one.  The Read test is fully independent.
 */

import { expect } from '@playwright/test';
import { adminTest as test } from '../fixtures/auth';
import { UsersPage } from '../pages/UsersPage';

// ── Test data ─────────────────────────────────────────────────────────────────
// Fixed identifiers for the user that is created, edited, then deleted.
const CREATED_USER = {
  name: 'E2E Created User',
  email: 'e2e-created@test.helpdesk.local',
  password: 'TestCreated@E2E1',
} as const;

const EDITED_NAME = 'E2E Edited User';

// Resolved lazily from env so missing vars surface as clear test failures.
const seedAdminName = () => process.env.TEST_SEED_NAME ?? 'Test Admin';
const seedAdminEmail = () => process.env.TEST_SEED_EMAIL ?? '';
const seedAgentEmail = () =>
  process.env.TEST_AGENT_EMAIL ?? 'agent@test.helpdesk.local';

// ═════════════════════════════════════════════════════════════════════════════
// 1. Read — seeded users appear in the table
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Users page — Read', () => {
  test('shows the page heading and "New User" button', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await expect(usersPage.heading).toBeVisible();
    await expect(usersPage.newUserButton).toBeVisible();
  });

  test('renders the expected table columns', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // Column headers are rendered as <th> elements inside <thead>.
    const thead = page.getByRole('columnheader');
    await expect(thead.filter({ hasText: 'Name' })).toBeVisible();
    await expect(thead.filter({ hasText: 'Email' })).toBeVisible();
    await expect(thead.filter({ hasText: 'Role' })).toBeVisible();
    await expect(thead.filter({ hasText: 'Joined' })).toBeVisible();
  });

  test('shows the seeded admin row with name, email, and admin role badge', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // The row for the seeded admin must contain the name, email, and role.
    const adminRow = usersPage.rowByText(seedAdminEmail());
    await expect(adminRow).toBeVisible();
    await expect(adminRow).toContainText(seedAdminName());
    await expect(adminRow).toContainText('admin');
  });

  test('shows the seeded agent row with email and agent role badge', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    const agentRow = usersPage.rowByText(seedAgentEmail());
    await expect(agentRow).toBeVisible();
    await expect(agentRow).toContainText('agent');
  });

  test('shows a Joined date cell for the seeded admin row', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // toLocaleDateString() produces a locale-specific date string — we can't
    // predict the exact format, but we can assert the cell is non-empty by
    // verifying the row renders more than just the name and email.
    const adminRow = usersPage.rowByText(seedAdminEmail());
    // The row has 5 cells: Name | Email | Role | Joined | Actions.
    const cells = adminRow.getByRole('cell');
    await expect(cells).toHaveCount(5);
    // The 4th cell (index 3) is the Joined date — assert it is not empty.
    await expect(cells.nth(3)).not.toBeEmpty();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2‑4. CRUD — Create → Edit → Delete a single subject user
//
// These three tests run sequentially and share state through `createdUserName`,
// which starts as CREATED_USER.name and becomes EDITED_NAME after the Edit
// test.  Playwright executes tests within a describe block in order by default.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Users page — Create, Edit, Delete (sequential)', () => {
  // Tracks the current display name of the subject user across tests.
  let currentName = CREATED_USER.name;

  // ── 2. Create ──────────────────────────────────────────────────────────────

  test('Create — new user appears in the table with correct name, email, and agent role', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.openCreateDialog();

    // Dialog title confirms we are in create mode.
    await expect(usersPage.formDialog).toContainText('Create New User');

    await usersPage.createUser(
      CREATED_USER.name,
      CREATED_USER.email,
      CREATED_USER.password,
    );

    // After the dialog closes TanStack Query refetches — wait for the new row.
    await usersPage.expectRowVisible(CREATED_USER.email);

    const newRow = usersPage.rowByText(CREATED_USER.email);
    await expect(newRow).toContainText(CREATED_USER.name);
    // The API always creates users as agents.
    await expect(newRow).toContainText('agent');
  });

  // ── 3. Edit ───────────────────────────────────────────────────────────────

  test('Edit — updated name appears in the table row', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // The subject user was created in the previous test.
    await usersPage.openEditDialog(currentName);

    // Dialog title confirms we are in edit mode.
    await expect(usersPage.formDialog).toContainText('Edit User');

    // Verify that the name input is pre-populated with the current name.
    await expect(usersPage.nameInput).toHaveValue(currentName);
    // Verify that the email input is pre-populated with the created email.
    await expect(usersPage.emailInput).toHaveValue(CREATED_USER.email);

    await usersPage.editUserName(EDITED_NAME);

    // Update tracking variable so the Delete test targets the right row.
    currentName = EDITED_NAME;

    // The table row should now show the new name.
    await usersPage.expectRowVisible(EDITED_NAME);
    const editedRow = usersPage.rowByText(CREATED_USER.email);
    await expect(editedRow).toContainText(EDITED_NAME);
    // Email and role must be unchanged.
    await expect(editedRow).toContainText(CREATED_USER.email);
    await expect(editedRow).toContainText('agent');
  });

  // ── 4. Delete ─────────────────────────────────────────────────────────────

  test('Delete — user row is removed from the table after confirmation', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // Confirm the subject row exists before deletion.
    await usersPage.expectRowVisible(currentName);

    await usersPage.openDeleteDialog(currentName);

    // AlertDialog title should name the user being deleted.
    await expect(usersPage.deleteDialog).toContainText(`Delete ${currentName}?`);

    await usersPage.confirmDelete();

    // After TanStack Query refetches, the row must be gone.
    await usersPage.expectRowAbsent(CREATED_USER.email);
  });
});
