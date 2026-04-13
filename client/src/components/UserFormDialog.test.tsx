import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { UserFormDialog } from './UserFormDialog';
import { renderWithClient } from '@/test/renderWithClient';
import type { User } from './UserTable';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const existingUser: User = {
  id: '1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'agent',
  createdAt: '2024-01-15T00:00:00.000Z',
};

function renderCreate(onOpenChange = vi.fn()) {
  return renderWithClient(
    <UserFormDialog open={true} onOpenChange={onOpenChange} />,
  );
}

function renderEdit(user: User = existingUser, onOpenChange = vi.fn()) {
  return renderWithClient(
    <UserFormDialog open={true} onOpenChange={onOpenChange} user={user} />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Create mode ─────────────────────────────────────────────────────────────

describe('UserFormDialog (create) — appearance', () => {
  it('shows "Create New User" as the title', () => {
    renderCreate();
    expect(screen.getByRole('heading', { name: /create new user/i })).toBeInTheDocument();
  });

  it('shows "Create User" on the submit button', () => {
    renderCreate();
    expect(screen.getByRole('button', { name: /^create user$/i })).toBeInTheDocument();
  });

  it('does not show the "leave blank" password hint', () => {
    renderCreate();
    expect(screen.queryByText(/leave blank/i)).not.toBeInTheDocument();
  });
});

describe('UserFormDialog (create) — validation', () => {
  it('shows name error when name is too short', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), 'AB');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows email error when email is invalid', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows password error when password is too short', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('requires password in create mode — shows error for empty password', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^email/i), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('shows all errors on empty-form submit', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });
});

describe('UserFormDialog (create) — submission', () => {
  const payload = { name: 'Jane Smith', email: 'jane@example.com', password: 'securepassword' };

  it('POSTs to /api/users with correct payload', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id: '3', ...payload, role: 'agent', createdAt: new Date().toISOString() },
    });
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), payload.name);
    await user.type(screen.getByLabelText(/^email/i), payload.email);
    await user.type(screen.getByLabelText(/^password/i), payload.password);
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/users', payload, {
        withCredentials: true,
      });
    });
  });

  it('shows "Creating…" and disables the button while pending', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn(() => new Promise(() => {}));
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), payload.name);
    await user.type(screen.getByLabelText(/^email/i), payload.email);
    await user.type(screen.getByLabelText(/^password/i), payload.password);
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  it('calls onOpenChange(false) on success', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id: '3', ...payload, role: 'agent', createdAt: new Date().toISOString() },
    });
    renderCreate(onOpenChange);

    await user.type(screen.getByLabelText(/^name/i), payload.name);
    await user.type(screen.getByLabelText(/^email/i), payload.email);
    await user.type(screen.getByLabelText(/^password/i), payload.password);
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('shows server error message on failure', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { data: { error: 'A user with that email already exists' } },
    });
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), payload.name);
    await user.type(screen.getByLabelText(/^email/i), payload.email);
    await user.type(screen.getByLabelText(/^password/i), payload.password);
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/a user with that email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message when server gives no message', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network error'));
    renderCreate();

    await user.type(screen.getByLabelText(/^name/i), payload.name);
    await user.type(screen.getByLabelText(/^email/i), payload.email);
    await user.type(screen.getByLabelText(/^password/i), payload.password);
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create user/i)).toBeInTheDocument();
    });
  });
});

// ─── Edit mode ───────────────────────────────────────────────────────────────

describe('UserFormDialog (edit) — appearance', () => {
  it('shows "Edit User" as the title', () => {
    renderEdit();
    expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument();
  });

  it('shows "Save Changes" on the submit button', () => {
    renderEdit();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('pre-populates name and email from the user prop', () => {
    renderEdit();
    expect(screen.getByLabelText<HTMLInputElement>(/^name/i).value).toBe(existingUser.name);
    expect(screen.getByLabelText<HTMLInputElement>(/^email/i).value).toBe(existingUser.email);
  });

  it('leaves the password field empty', () => {
    renderEdit();
    expect(screen.getByLabelText<HTMLInputElement>(/^password/i).value).toBe('');
  });

  it('shows the "leave blank" password hint', () => {
    renderEdit();
    expect(screen.getByText(/leave blank/i)).toBeInTheDocument();
  });
});

describe('UserFormDialog (edit) — validation', () => {
  it('allows submitting without a password in edit mode', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: existingUser });
    renderEdit();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalled();
    });
  });

  it('shows password error when a short password is entered in edit mode', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

describe('UserFormDialog (edit) — submission', () => {
  it('PATCHes to /api/users/:id with correct payload', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: existingUser });
    renderEdit();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `/api/users/${existingUser.id}`,
        { name: existingUser.name, email: existingUser.email, password: '' },
        { withCredentials: true },
      );
    });
  });

  it('includes the new password in the payload when provided', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: existingUser });
    renderEdit();

    await user.clear(screen.getByLabelText(/^password/i));
    await user.type(screen.getByLabelText(/^password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `/api/users/${existingUser.id}`,
        { name: existingUser.name, email: existingUser.email, password: 'newpassword123' },
        { withCredentials: true },
      );
    });
  });

  it('shows "Saving…" and disables the button while pending', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn(() => new Promise(() => {}));
    renderEdit();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  it('calls onOpenChange(false) on success', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: existingUser });
    renderEdit(existingUser, onOpenChange);

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('shows server error message on failure', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn().mockRejectedValue({
      response: { data: { error: 'A user with that email already exists' } },
    });
    renderEdit();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/a user with that email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message when server gives no message', async () => {
    const user = userEvent.setup();
    mockedAxios.patch = vi.fn().mockRejectedValue(new Error('Network error'));
    renderEdit();

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to update user/i)).toBeInTheDocument();
    });
  });
});
