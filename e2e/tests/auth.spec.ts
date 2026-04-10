/**
 * auth.spec.ts
 *
 * Comprehensive E2E tests for the Helpdesk authentication system.
 *
 * Strategy: integration tests against a real backend (test DB).
 * global-setup.ts resets the test DB, seeds admin + agent users, and saves
 * Playwright storageState files so authenticated tests skip re-logging in.
 *
 * Test groups:
 *  1. Login page — form validation (client-side, no server call)
 *  2. Login — failed attempts (server-side errors)
 *  3. Login — successful flow
 *  4. Already-authenticated redirect
 *  5. Protected routes — unauthenticated access
 *  6. Logout
 *  7. Admin-only routes — admin access
 *  8. Admin-only routes — agent is redirected
 */

import { test, expect } from '@playwright/test';
import { adminTest, agentTest, getAdminCredentials } from '../fixtures/auth';
import { LoginPage } from '../pages/LoginPage';

// ── Credentials ──────────────────────────────────────────────────────────────
// Resolved lazily so that env-var errors surface as clear test failures rather
// than module-load errors.
const adminCreds = () => getAdminCredentials();

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Form validation (client-side, no network call required)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Login form — client-side validation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('renders the login card with email, password and submit button', async ({
    page,
  }) => {
    // CardTitle renders as <div>, not <h*> — match by text.
    await expect(page.getByText('Helpdesk').first()).toBeVisible();
    await expect(
      page.getByText('Sign in to your account'),
    ).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('shows field errors when form is submitted empty', async () => {
    // Submit without filling anything — Zod validates on submit.
    await loginPage.submit();

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();
  });

  test('shows email format error for an invalid email string', async () => {
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('somepassword');
    await loginPage.submit();

    await expect(loginPage.emailError).toBeVisible();
    // Password error must NOT appear — only email is invalid.
    await expect(loginPage.passwordError).not.toBeVisible();
  });

  test('shows password-required error when only email is filled', async () => {
    await loginPage.fillEmail('user@example.com');
    // Leave password blank.
    await loginPage.submit();

    await expect(loginPage.passwordError).toBeVisible();
    await expect(loginPage.emailError).not.toBeVisible();
  });

  test('clears email field error once the value is corrected and form is re-submitted', async () => {
    // Trigger the email error by submitting with an invalid value.
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('somepassword');
    await loginPage.submit();
    await expect(loginPage.emailError).toBeVisible();

    // Fix the email and re-submit — react-hook-form re-validates on the next
    // submit (default onSubmit mode), so the error should disappear.
    await loginPage.fillEmail('valid@example.com');
    await loginPage.submit();

    // The email error is gone. The form will attempt a real server call now
    // (and fail), but the client-side email validation error must be absent.
    await expect(loginPage.emailError).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Login failures (server-side errors)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Login — failed attempts', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('shows an error banner for an unknown email address', async () => {
    await loginPage.login('nobody@unknown.example.com', 'irrelevant123');

    // The server returns an error; LoginPage renders the red banner.
    await loginPage.expectServerError('Invalid');
    // We must still be on /login.
    await loginPage.expectOnLoginPage();
  });

  test('shows an error banner for a known email with the wrong password', async () => {
    const { email } = adminCreds();
    await loginPage.login(email, 'WrongPassword999!');

    await loginPage.expectServerError('Invalid');
    await loginPage.expectOnLoginPage();
  });

  test('dismiss button removes the server error banner', async ({ page }) => {
    const { email } = adminCreds();
    await loginPage.login(email, 'WrongPassword999!');

    await loginPage.expectServerError('Invalid');

    await loginPage.serverErrorDismiss.click();
    await expect(loginPage.serverError).not.toBeVisible();
  });

  test('allows retrying after a failed login attempt', async () => {
    const { email, password } = adminCreds();

    // First attempt — wrong password.
    await loginPage.login(email, 'BadPassword!');
    await loginPage.expectServerError('Invalid');

    // Correct credentials on the retry.
    await loginPage.fillPassword(password);
    await loginPage.submit();

    await expect(loginPage.page).toHaveURL('/');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Successful login
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Login — successful flow', () => {
  test('redirects admin to the home page after valid credentials', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const { email, password } = adminCreds();

    await loginPage.goto();
    await loginPage.login(email, password);

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome to Helpdesk' }),
    ).toBeVisible();
  });

  test('shows the authenticated nav bar after login (Helpdesk brand + Sign out)', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const { email, password } = adminCreds();

    await loginPage.goto();
    await loginPage.login(email, password);

    // Nav brand text is rendered as a <span>, not a link.
    await expect(page.getByText('Helpdesk').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign out' }),
    ).toBeVisible();
  });

  test('displays the signed-in user name in the nav bar', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { email, password } = adminCreds();
    const name = process.env.TEST_SEED_NAME ?? 'Test Admin';

    await loginPage.goto();
    await loginPage.login(email, password);

    await expect(page.getByText(name)).toBeVisible();
  });

  test('submit button shows "Signing in…" while the request is in flight', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const { email, password } = adminCreds();

    await loginPage.goto();
    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);

    // Intercept the auth request to keep it pending long enough to observe the
    // loading text, then release it.
    let resolveDelay!: () => void;
    const delay = new Promise<void>((resolve) => {
      resolveDelay = resolve;
    });

    await page.route('**/api/auth/sign-in/**', async (route) => {
      await delay;
      await route.continue();
    });

    // Click submit — do NOT await navigation yet.
    const submitPromise = loginPage.submit();

    // The button text should change to the loading label.
    await expect(loginPage.submitButton).toHaveText('Signing in…');

    // Release the network hold and let the test finish normally.
    resolveDelay();
    await submitPromise;
    await expect(page).toHaveURL('/');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Already-authenticated redirect
// ═══════════════════════════════════════════════════════════════════════════════

adminTest.describe('Already authenticated — /login redirect', () => {
  adminTest(
    'visiting /login while authenticated redirects to home page',
    async ({ page }) => {
      // The adminTest fixture loads the pre-saved admin storageState, so the
      // browser already has an active session before this test runs.
      await page.goto('/login');

      // LoginPage detects an existing session and immediately renders
      // <Navigate to="/" replace />.
      await expect(page).toHaveURL('/');
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Protected routes — unauthenticated access
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Protected routes — unauthenticated access', () => {
  // These tests use the default (unauthenticated) `page` fixture.

  test('visiting / redirects to /login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('visiting /users redirects to /login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });

  test('login page is accessible without authentication', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Helpdesk').first()).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Logout
// ═══════════════════════════════════════════════════════════════════════════════

// Logout tests do a fresh login each time so they don't invalidate the shared
// adminTest storageState, which would cascade-fail subsequent adminTest groups.
test.describe('Logout', () => {
  test('clicking "Sign out" redirects to /login', async ({ page }) => {
    const { email, password } = adminCreds();
    await new LoginPage(page).goto();
    await new LoginPage(page).login(email, password);
    await expect(page).toHaveURL('/');

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/login');
  });

  test(
    'session is cleared after logout — visiting / redirects to /login',
    async ({ page }) => {
      const { email, password } = adminCreds();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);
      await expect(page).toHaveURL('/');

      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL('/login');

      // Attempt to navigate to a protected route — should stay on /login.
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    },
  );

  test(
    'session is cleared after logout — /login page does not redirect',
    async ({ page }) => {
      const { email, password } = adminCreds();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);
      await expect(page).toHaveURL('/');

      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL('/login');

      // Refreshing /login should NOT redirect to home; the session is gone.
      await page.reload();
      await expect(page).toHaveURL('/login');
      // CardTitle renders as <div>, not <h*> — match by text.
      await expect(page.getByText('Helpdesk').first()).toBeVisible();
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Admin-only routes — admin can access
// ═══════════════════════════════════════════════════════════════════════════════

adminTest.describe('Admin-only routes — admin access', () => {
  adminTest('admin can navigate directly to /users', async ({ page }) => {
    await page.goto('/users');

    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  adminTest('admin sees the "Users" nav link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  });

  adminTest(
    'admin can reach /users by clicking the nav Users link',
    async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Users' }).click();

      await expect(page).toHaveURL('/users');
      await expect(
        page.getByRole('heading', { name: 'Users' }),
      ).toBeVisible();
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Admin-only routes — agent is redirected
// ═══════════════════════════════════════════════════════════════════════════════

agentTest.describe('Admin-only routes — agent is redirected', () => {
  agentTest(
    'agent visiting /users is redirected to / (home)',
    async ({ page }) => {
      await page.goto('/users');

      // AdminRoute renders <Navigate to="/" replace /> for non-admins.
      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: 'Welcome to Helpdesk' }),
      ).toBeVisible();
    },
  );

  agentTest(
    'agent does NOT see the "Users" nav link',
    async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
    },
  );

  agentTest(
    'agent can access the home page without being redirected',
    async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: 'Welcome to Helpdesk' }),
      ).toBeVisible();
    },
  );
});
