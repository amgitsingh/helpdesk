import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import UsersPage from './UsersPage';
import { renderWithClient } from '@/test/renderWithClient';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockUsers = [
  { id: '1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin' as const, createdAt: '2024-01-15T00:00:00.000Z' },
  { id: '2', name: 'Bob Agent', email: 'bob@example.com', role: 'agent' as const, createdAt: '2024-03-20T00:00:00.000Z' },
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
