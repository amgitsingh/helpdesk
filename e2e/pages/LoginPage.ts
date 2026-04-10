import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for /login
 *
 * Wraps all locator and interaction logic for the login form so that test
 * files stay declarative and locator changes are fixed in one place.
 */
export class LoginPage {
  readonly page: Page;

  // ── Form fields ────────────────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // ── Validation / error surfaces ────────────────────────────────────────────
  // Field-level Zod messages rendered as <p> tags beneath each input.
  readonly emailError: Locator;
  readonly passwordError: Locator;
  // Server-level error rendered in the red banner at the top of the card.
  readonly serverError: Locator;
  readonly serverErrorDismiss: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.locator('button[type="submit"]');

    // The field error <p> tags sit directly after their sibling input inside
    // the same .space-y-1.5 container.  We select them by their text content
    // patterns that match the Zod schema messages.
    this.emailError = page.getByText('Enter a valid email address');
    this.passwordError = page.getByText('Password is required');

    // The server error banner — identified by a stable data-testid attribute.
    // The dismiss button inside it is labelled "Dismiss" via aria-label.
    this.serverError = page.getByTestId('server-error-banner');
    this.serverErrorDismiss = page.getByRole('button', { name: 'Dismiss' });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill both fields and submit in one call.  Awaits the button click only —
   * callers assert the resulting state themselves.
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL('/login');
    // CardTitle renders as <div>, not <h*>, so we match by text content.
    await expect(this.page.getByText('Helpdesk').first()).toBeVisible();
  }

  async expectServerError(messageSubstring: string): Promise<void> {
    await expect(this.serverError).toBeVisible();
    await expect(this.serverError).toContainText(messageSubstring);
  }

  async expectSubmitButtonDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }
}
