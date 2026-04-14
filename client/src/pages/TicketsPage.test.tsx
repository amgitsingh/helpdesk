import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import TicketsPage from './TicketsPage';
import { renderWithClient } from '@/test/renderWithClient';
import { TicketStatus, TicketCategory, type Ticket } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockTickets: Ticket[] = [
  {
    id: '1',
    subject: 'My order is missing',
    senderEmail: 'alice@example.com',
    senderName: 'Alice Smith',
    status: TicketStatus.open,
    category: TicketCategory.general_question,
    assignedTo: null,
    createdAt: '2024-03-15T10:00:00.000Z',
  },
  {
    id: '2',
    subject: 'Billing issue',
    senderEmail: 'bob@example.com',
    senderName: 'Bob Jones',
    status: TicketStatus.resolved,
    category: TicketCategory.refund_request,
    assignedTo: { id: 'u1', name: 'Agent One' },
    createdAt: '2024-01-20T08:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TicketsPage', () => {
  it('shows skeletons while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves
    renderWithClient(<TicketsPage />);

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders the ticket table with data after loading', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('Billing issue')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders status badges correctly', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders category labels correctly', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('General Question')).toBeInTheDocument();
    expect(screen.getByText('Refund Request')).toBeInTheDocument();
  });

  it('shows "—" for tickets with a null category', async () => {
    const ticketWithNoCategory: Ticket = {
      ...mockTickets[0],
      id: '3',
      category: null,
    };
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [ticketWithNoCategory] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders a formatted created date', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(
      screen.getByText(new Date('2024-03-15T10:00:00.000Z').toLocaleDateString()),
    ).toBeInTheDocument();
  });

  it('shows empty state when no tickets are returned', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });
  });

  it('shows error message when the request fails', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load tickets.')).toBeInTheDocument();
    });
  });

  it('calls the correct endpoint with credentials', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets', { withCredentials: true });
  });
});
