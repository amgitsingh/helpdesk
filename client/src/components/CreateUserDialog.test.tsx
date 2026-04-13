import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { CreateUserDialog } from './CreateUserDialog';
import { renderWithClient } from '@/test/renderWithClient';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

function renderDialog(open = true, onOpenChange = vi.fn()) {
  return renderWithClient(<CreateUserDialog open={open} onOpenChange={onOpenChange} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateUserDialog — validation', () => {
  it('shows name error when name is too short', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'AB');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('marks the name field as invalid when name is too short', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'AB');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('shows email error when email is invalid', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows password error when password is too short', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows all errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('does not submit when the form is invalid', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

describe('CreateUserDialog — submission', () => {
  const validUser = { name: 'Jane Smith', email: 'jane@example.com', password: 'securepassword' };

  it('submits the form with correct payload and credentials', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id: '3', ...validUser, role: 'agent', createdAt: new Date().toISOString() },
    });
    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/^name/i), validUser.name);
    await user.type(screen.getByLabelText(/^email/i), validUser.email);
    await user.type(screen.getByLabelText(/^password/i), validUser.password);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users',
        { name: validUser.name, email: validUser.email, password: validUser.password },
        { withCredentials: true },
      );
    });
  });

  it('disables the submit button and shows "Creating…" while pending', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn(() => new Promise(() => {})); // never resolves
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), validUser.name);
    await user.type(screen.getByLabelText(/^email/i), validUser.email);
    await user.type(screen.getByLabelText(/^password/i), validUser.password);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });

  it('calls onOpenChange(false) after a successful submission', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { id: '3', ...validUser, role: 'agent', createdAt: new Date().toISOString() },
    });
    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/^name/i), validUser.name);
    await user.type(screen.getByLabelText(/^email/i), validUser.email);
    await user.type(screen.getByLabelText(/^password/i), validUser.password);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows a server error message when the request fails', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn().mockRejectedValue({
      response: { data: { error: 'A user with that email already exists' } },
    });
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), validUser.name);
    await user.type(screen.getByLabelText(/^email/i), validUser.email);
    await user.type(screen.getByLabelText(/^password/i), validUser.password);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/a user with that email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows a fallback error message when the server error has no message', async () => {
    const user = userEvent.setup();
    mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network error'));
    renderDialog();

    await user.type(screen.getByLabelText(/^name/i), validUser.name);
    await user.type(screen.getByLabelText(/^email/i), validUser.email);
    await user.type(screen.getByLabelText(/^password/i), validUser.password);
    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create user/i)).toBeInTheDocument();
    });
  });
});
