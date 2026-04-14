import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import TicketsPage from './TicketsPage';
import { renderWithClient } from '@/test/renderWithClient';
import { TicketStatus, TicketCategory, type Ticket, type TicketPage } from '@helpdesk/core';

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

function mockPage(tickets: Ticket[], total?: number, page = 1): TicketPage {
  return { data: tickets, total: total ?? tickets.length, page, pageSize: 10 };
}

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
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('Billing issue')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders status badges correctly', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders category labels correctly', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets) });
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
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([ticketWithNoCategory]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders a formatted created date', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(
      screen.getByText(new Date('2024-03-15T10:00:00.000Z').toLocaleDateString()),
    ).toBeInTheDocument();
  });

  it('shows empty state when no tickets are returned', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
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

  it('calls the correct endpoint with credentials and default params', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets', {
      withCredentials: true,
      params: { sortBy: 'createdAt', sortDir: 'desc', page: 1, pageSize: 10 },
    });
  });

  it('renders the Status and Category filter dropdowns', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox', { name: /search tickets/i })).toBeInTheDocument();
  });

  it('does not show the Clear button when no filter is active', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('sends the status filter param when a status is selected', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /filter by status/i }));
    await user.click(screen.getByRole('option', { name: 'Open' }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 1, pageSize: 10, status: TicketStatus.open },
      });
    });
  });

  it('sends the category filter param when a category is selected', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: 'Refund Request' }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 1, pageSize: 10, category: TicketCategory.refund_request },
      });
    });
  });

  it('shows Clear button when search input has text and clears it', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'alice');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByRole('textbox', { name: /search tickets/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('sends the search param after debounce when text is typed', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'billing');

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 1, pageSize: 10, search: 'billing' },
      });
    }, { timeout: 2000 });
  });

  it('Clear button resets all filters and refetches with default params', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage([]) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'test');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /search tickets/i })).toHaveValue('');

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 1, pageSize: 10 },
      });
    }, { timeout: 2000 });
  });

  it('shows pagination controls and record count', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets, 45) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    expect(screen.getByText('1–10 of 45')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /first page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /last page/i })).not.toBeDisabled();
  });

  it('fetches the next page when Next is clicked', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets, 45) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 2, pageSize: 10 },
      });
    });
  });

  it('fetches the last page when Last is clicked', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets, 45) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /last page/i }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', page: 5, pageSize: 10 },
      });
    });
  });

  it('disables all navigation buttons on a single page', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockPage(mockTickets, 2) });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /first page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /last page/i })).toBeDisabled();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
