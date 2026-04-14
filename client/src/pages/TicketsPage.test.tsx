import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('calls the correct endpoint with credentials and default sort params', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTickets });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets', {
      withCredentials: true,
      params: { sortBy: 'createdAt', sortDir: 'desc' },
    });
  });

  it('renders the Status and Category filter dropdowns', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox', { name: /search tickets/i })).toBeInTheDocument();
  });

  it('does not show the Clear button when no filter is active', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => {
      expect(screen.getByText('No tickets found.')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('sends the status filter param when a status is selected', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /filter by status/i }));
    await user.click(screen.getByRole('option', { name: 'Open' }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', status: TicketStatus.open },
      });
    });
  });

  it('sends the category filter param when a category is selected', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /filter by category/i }));
    await user.click(screen.getByRole('option', { name: 'Refund Request' }));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', category: TicketCategory.refund_request },
      });
    });
  });

  it('shows Clear button when search input has text and clears it', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    // hasActiveFilter is based on searchInput (immediate), so Clear appears as soon as text is typed
    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'alice');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByRole('textbox', { name: /search tickets/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('sends the search param after debounce when text is typed', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'billing');

    // waitFor polls until the debounced axios call fires (300ms debounce + render)
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc', search: 'billing' },
      });
    }, { timeout: 2000 });
  });

  it('Clear button resets all filters and refetches with default params', async () => {
    const user = userEvent.setup();
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithClient(<TicketsPage />);

    await waitFor(() => expect(screen.getByText('No tickets found.')).toBeInTheDocument());

    // Type in search box to make Clear appear
    await user.type(screen.getByRole('textbox', { name: /search tickets/i }), 'test');
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /search tickets/i })).toHaveValue('');

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith('/api/tickets', {
        withCredentials: true,
        params: { sortBy: 'createdAt', sortDir: 'desc' },
      });
    }, { timeout: 2000 });
  });
});
