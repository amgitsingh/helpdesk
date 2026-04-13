import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import UsersPage from './UsersPage';
import { renderWithClient } from '@/test/renderWithClient';
import { Role } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockUsers = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: Role.admin, createdAt: '2024-01-15T00:00:00.000Z' },
  { id: '2', name: 'Bob Agent', email: 'bob@example.com', role: Role.agent, createdAt: '2024-03-20T00:00:00.000Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UsersPage', () => {
  it('shows skeletons while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves
    renderWithClient(<UsersPage />);

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the user table with data after loading', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockUsers });
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Agent')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('renders role badges correctly', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockUsers });
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  it('renders formatted join dates', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockUsers });
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    expect(screen.getByText(new Date('2024-01-15T00:00:00.000Z').toLocaleDateString())).toBeInTheDocument();
  });

  it('shows empty state when no users are returned', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
  });

  it('shows error message when the request fails', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users.')).toBeInTheDocument();
    });
  });

  it('calls the correct endpoint with credentials', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockUsers });
    renderWithClient(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users', { withCredentials: true });
  });
});

describe('UsersPage — Create User dialog', () => {
  beforeEach(() => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockUsers });
  });

  it('dialog is not visible on initial render', () => {
    renderWithClient(<UsersPage />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the dialog when "New User" is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /new user/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /new user/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes the dialog when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderWithClient(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /new user/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('resets form fields when dialog is closed and reopened', async () => {
    const user = userEvent.setup();
    renderWithClient(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /new user/i }));
    await user.type(screen.getByLabelText(/^name/i), 'Test Name');
    expect(screen.getByLabelText<HTMLInputElement>(/^name/i).value).toBe('Test Name');

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /new user/i }));
    expect(screen.getByLabelText<HTMLInputElement>(/^name/i).value).toBe('');
  });
});
