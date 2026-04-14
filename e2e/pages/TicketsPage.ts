import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for /tickets
 *
 * Encapsulates locator and interaction logic for the Tickets page and the
 * TicketTable component.  Test files stay declarative; DOM changes are fixed
 * here in one place.
 */
export class TicketsPage {
  readonly page: Page;

  // ── Page-level ─────────────────────────────────────────────────────────────
  readonly heading: Locator;

  // ── Nav ────────────────────────────────────────────────────────────────────
  readonly ticketsNavLink: Locator;

  // ── Table ──────────────────────────────────────────────────────────────────
  readonly table: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // CardTitle renders as a <div data-slot="card-title"> element.
    this.heading = page.locator('[data-slot="card-title"]', { hasText: 'Tickets' });

    // Nav link — exact text match so we don't accidentally match the heading.
    this.ticketsNavLink = page.getByRole('link', { name: 'Tickets', exact: true });

    this.table = page.getByRole('table');
    this.emptyState = page.getByText('No tickets found.');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/tickets');
    // Wait until the heading is visible — confirms the authenticated page has
    // fully rendered (TanStack Query fetch completed).
    await expect(this.heading).toBeVisible();
  }

  // ── Table helpers ──────────────────────────────────────────────────────────

  /**
   * Returns the <tr> that contains the given text in any of its cells.
   * Used to locate a specific ticket row by subject, sender, etc.
   */
  rowByText(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  /** Assert that a row containing `text` is visible in the table. */
  async expectRowVisible(text: string): Promise<void> {
    await expect(this.rowByText(text)).toBeVisible();
  }

  /**
   * Returns all data rows (excluding the header row).
   * The <thead> row is role="row" inside role="rowgroup" — filtering by
   * getByRole('rowgroup').last() gives us the <tbody> rows only.
   */
  dataRows(): Locator {
    return this.page.getByRole('rowgroup').last().getByRole('row');
  }
}
