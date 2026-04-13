import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserTable, type User } from './UserTable';
import { renderWithClient } from '@/test/renderWithClient';
import { Role } from '@helpdesk/core';

const mockUsers: User[] = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: Role.admin, createdAt: '2024-01-15T00:00:00.000Z' },
  { id: '2', name: 'Bob Agent', email: 'bob@example.com', role: Role.agent, createdAt: '2024-03-20T00:00:00.000Z' },
];

function renderTable(onEdit = vi.fn(), onDelete = vi.fn()) {
  return renderWithClient(
    <UserTable
      users={mockUsers}
      isPending={false}
      isError={false}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserTable — delete button', () => {
  it('renders a delete button for each row', () => {
    renderTable();
    expect(screen.getByRole('button', { name: /delete alice admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete bob agent/i })).toBeInTheDocument();
  });

  it('disables the delete button for admin users', () => {
    renderTable();
    expect(screen.getByRole('button', { name: /delete alice admin/i })).toBeDisabled();
  });

  it('enables the delete button for agent users', () => {
    renderTable();
    expect(screen.getByRole('button', { name: /delete bob agent/i })).not.toBeDisabled();
  });

  it('calls onDelete with the correct user when clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderTable(vi.fn(), onDelete);

    await user.click(screen.getByRole('button', { name: /delete bob agent/i }));

    expect(onDelete).toHaveBeenCalledWith(mockUsers[1]);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('UserTable — edit button (regression)', () => {
  it('renders an edit button for each row', () => {
    renderTable();
    expect(screen.getByRole('button', { name: /edit alice admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit bob agent/i })).toBeInTheDocument();
  });

  it('calls onEdit with the correct user when clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderTable(onEdit);

    await user.click(screen.getByRole('button', { name: /edit bob agent/i }));

    expect(onEdit).toHaveBeenCalledWith(mockUsers[1]);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
