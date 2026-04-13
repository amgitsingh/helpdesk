import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { DeleteUserDialog } from './DeleteUserDialog';
import { renderWithClient } from '@/test/renderWithClient';
import type { User } from './UserTable';
import { Role } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const agentUser: User = {
  id: '2',
  name: 'Bob Agent',
  email: 'bob@example.com',
  role: Role.agent,
  createdAt: '2024-03-20T00:00:00.000Z',
};

function renderDialog(user: User | null = agentUser, onClose = vi.fn()) {
  return renderWithClient(<DeleteUserDialog user={user} onClose={onClose} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteUserDialog — appearance', () => {
  it('is not rendered when user is null', () => {
    renderDialog(null);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows the user name in the title', () => {
    renderDialog();
    expect(screen.getByText(/delete bob agent/i)).toBeInTheDocument();
  });

  it('shows the user name and email in the description', () => {
    renderDialog();
    // Name appears in both title and description; email is unique to the description
    expect(screen.getAllByText(/bob agent/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/bob@example\.com/i)).toBeInTheDocument();
  });

  it('shows Cancel and Delete buttons', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });
});

describe('DeleteUserDialog — confirmation', () => {
  it('calls onClose without making a request when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog(agentUser, onClose);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });

  it('calls DELETE /api/users/:id with credentials when Delete is clicked', async () => {
    const user = userEvent.setup();
    mockedAxios.delete = vi.fn().mockResolvedValue({});
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `/api/users/${agentUser.id}`,
        { withCredentials: true },
      );
    });
  });

  it('shows "Deleting…" and disables both buttons while pending', async () => {
    const user = userEvent.setup();
    mockedAxios.delete = vi.fn(() => new Promise(() => {}));
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('calls onClose after successful deletion', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockedAxios.delete = vi.fn().mockResolvedValue({});
    renderDialog(agentUser, onClose);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('shows server error message when request fails', async () => {
    const user = userEvent.setup();
    mockedAxios.delete = vi.fn().mockRejectedValue({
      response: { data: { error: 'Admin users cannot be deleted' } },
    });
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/admin users cannot be deleted/i)).toBeInTheDocument();
    });
  });

  it('shows fallback error message when server gives no message', async () => {
    const user = userEvent.setup();
    mockedAxios.delete = vi.fn().mockRejectedValue(new Error('Network error'));
    renderDialog();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to delete user/i)).toBeInTheDocument();
    });
  });
});
