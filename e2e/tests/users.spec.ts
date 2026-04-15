/**
 * users.spec.ts
 *
 * E2E tests for the User Management feature (/users).
 * Strategy: integration tests against a real backend (test DB).
 *
 * Kept tests are ones that cannot be covered by unit tests:
 *   - The Create → Edit → Delete flow requires a real server + DB and spans
 *     multiple sequential steps that share state.
 *
 * Rendering details (table columns, role badges, date formatting, page heading,
 * empty state, dialog open/close) are covered by UsersPage, UserTable,
 * UserFormDialog, and DeleteUserDialog unit tests and must NOT be duplicated here.
 */

import { expect } from '@playwright/test';
import { adminTest as test } from '../fixtures/auth';
import { UsersPage } from '../pages/UsersPage';

// ── Test data ─────────────────────────────────────────────────────────────────

const CREATED_USER = {
  name: 'E2E Created User',
  email: 'e2e-created@test.helpdesk.local',
  password: 'TestCreated@E2E1',
} as const;

const EDITED_NAME = 'E2E Edited User';

// ═════════════════════════════════════════════════════════════════════════════
// Create → Edit → Delete (sequential)
//
// Each step depends on the previous one. Playwright runs tests within a
// describe block in order by default.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Users page — Create, Edit, Delete (sequential)', () => {
  let currentName = CREATED_USER.name;

  test('Create — new user appears in the table with correct name, email, and agent role', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.openCreateDialog();
    await expect(usersPage.formDialog).toContainText('Create New User');

    await usersPage.createUser(
      CREATED_USER.name,
      CREATED_USER.email,
      CREATED_USER.password,
    );

    await usersPage.expectRowVisible(CREATED_USER.email);

    const newRow = usersPage.rowByText(CREATED_USER.email);
    await expect(newRow).toContainText(CREATED_USER.name);
    await expect(newRow).toContainText('agent');
  });

  test('Edit — updated name appears in the table row', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.openEditDialog(currentName);
    await expect(usersPage.formDialog).toContainText('Edit User');
    await expect(usersPage.nameInput).toHaveValue(currentName);
    await expect(usersPage.emailInput).toHaveValue(CREATED_USER.email);

    await usersPage.editUserName(EDITED_NAME);
    currentName = EDITED_NAME;

    await usersPage.expectRowVisible(EDITED_NAME);
    const editedRow = usersPage.rowByText(CREATED_USER.email);
    await expect(editedRow).toContainText(EDITED_NAME);
    await expect(editedRow).toContainText(CREATED_USER.email);
    await expect(editedRow).toContainText('agent');
  });

  test('Delete — user row is removed from the table after confirmation', async ({
    page,
  }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.expectRowVisible(currentName);
    await usersPage.openDeleteDialog(currentName);
    await expect(usersPage.deleteDialog).toContainText(`Delete ${currentName}?`);

    await usersPage.confirmDelete();

    await usersPage.expectRowAbsent(CREATED_USER.email);
  });
});
