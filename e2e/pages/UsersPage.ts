import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for /users
 *
 * Encapsulates all locator and interaction logic for the Users page,
 * the UserFormDialog (create / edit), and the DeleteUserDialog (alertdialog).
 * Test files stay declarative; DOM changes are fixed here in one place.
 */
export class UsersPage {
  readonly page: Page;

  // ── Page-level ─────────────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly newUserButton: Locator;

  // ── Table ──────────────────────────────────────────────────────────────────
  readonly table: Locator;

  // ── Create / Edit dialog (role="dialog") ───────────────────────────────────
  readonly formDialog: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly createUserButton: Locator;
  readonly saveChangesButton: Locator;
  readonly cancelButton: Locator;

  // ── Delete dialog (role="alertdialog") ─────────────────────────────────────
  readonly deleteDialog: Locator;
  readonly deleteConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('[data-slot="card-title"]', { hasText: 'Users' });
    this.newUserButton = page.getByRole('button', { name: 'New User' });

    this.table = page.getByRole('table');

    // The dialog opened by "New User" / edit pencil.
    this.formDialog = page.getByRole('dialog');

    // Inputs are identified by their <Label htmlFor="…"> associations so we
    // use getByLabel — the most resilient selector for form fields.
    this.nameInput = page.getByLabel('Name');
    this.emailInput = page.getByLabel('Email');
    // The password label reads "Password (leave blank to keep current)" in edit
    // mode; exact: false matches both variants.
    this.passwordInput = page.getByLabel('Password', { exact: false });

    this.createUserButton = page.getByRole('button', { name: 'Create User' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
    // There is only one Cancel button visible at a time (form dialog or
    // alertdialog), so this is unambiguous.
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });

    // Delete confirmation uses role="alertdialog".
    this.deleteDialog = page.getByRole('alertdialog');
    this.deleteConfirmButton = page.getByRole('button', { name: 'Delete' });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/users');
    // Wait until the table (or "No users found" cell) is present — confirms
    // the TanStack Query fetch completed and the page has rendered.
    await expect(this.heading).toBeVisible();
  }

  // ── Table helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the <tr> that contains the given text in any of its cells.
   * Useful for asserting a specific user row is present or absent.
   */
  rowByText(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  /** Assert that a row containing `text` is visible in the table. */
  async expectRowVisible(text: string): Promise<void> {
    await expect(this.rowByText(text)).toBeVisible();
  }

  /** Assert that no row containing `text` exists in the table. */
  async expectRowAbsent(text: string): Promise<void> {
    await expect(this.rowByText(text)).not.toBeAttached();
  }

  // ── Dialog actions ─────────────────────────────────────────────────────────

  /** Open the create-user dialog via the "New User" button. */
  async openCreateDialog(): Promise<void> {
    await this.newUserButton.click();
    await expect(this.formDialog).toBeVisible();
  }

  /**
   * Open the edit dialog for a named user via its pencil button.
   * The button's aria-label is "Edit <name>".
   */
  async openEditDialog(userName: string): Promise<void> {
    await this.page
      .getByRole('button', { name: `Edit ${userName}` })
      .click();
    await expect(this.formDialog).toBeVisible();
  }

  /**
   * Open the delete confirmation dialog for a named user via its trash button.
   * The button's aria-label is "Delete <name>".
   */
  async openDeleteDialog(userName: string): Promise<void> {
    await this.page
      .getByRole('button', { name: `Delete ${userName}` })
      .click();
    await expect(this.deleteDialog).toBeVisible();
  }

  /** Fill the create form and submit. Waits for the dialog to close. */
  async createUser(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.createUserButton.click();
    // Dialog closes on success; wait for it to disappear before asserting
    // table state so we don't race against the TanStack Query refetch.
    await expect(this.formDialog).not.toBeVisible();
  }

  /** Fill only the name field in the edit form and submit. Waits for close. */
  async editUserName(newName: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveChangesButton.click();
    await expect(this.formDialog).not.toBeVisible();
  }

  /** Click the confirm "Delete" button in the alertdialog. Waits for close. */
  async confirmDelete(): Promise<void> {
    await this.deleteConfirmButton.click();
    await expect(this.deleteDialog).not.toBeVisible();
  }
}
