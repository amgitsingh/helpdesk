import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TicketDetailPage from './TicketDetailPage';
import { TicketStatus, TicketCategory, type TicketDetail } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockTicket: TicketDetail = {
  id: 'ticket-1',
  subject: 'My order is missing',
  body: 'I placed an order 5 days ago and it has not arrived yet.',
  senderEmail: 'alice@example.com',
  senderName: 'Alice Smith',
  status: TicketStatus.open,
  category: TicketCategory.general_question,
  assignedTo: { id: 'u1', name: 'Agent One' },
  aiSummary: 'Customer reports missing order placed 5 days ago.',
  aiSuggestedReply: 'Hi Alice, we are looking into your order right away.',
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-16T09:00:00.000Z',
  messages: [
    {
      id: 'msg-1',
      body: 'Any update on my order?',
      sender: 'customer',
      sentAt: '2024-03-16T08:00:00.000Z',
      user: null,
    },
    {
      id: 'msg-2',
      body: 'We are checking with the warehouse.',
      sender: 'agent',
      sentAt: '2024-03-16T09:00:00.000Z',
      user: { id: 'u1', name: 'Agent One' },
    },
  ],
};

function renderDetail(id = 'ticket-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...require('@testing-library/react').render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/tickets/${id}`]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TicketDetailPage', () => {
  it('shows skeletons while loading', () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {}));
    renderDetail();

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error message when request fails', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('Failed to load ticket.')).toBeInTheDocument();
    });
  });

  it('renders subject as page heading', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });
  });

  it('renders status badge', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders category badge', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('General Question')).toBeInTheDocument();
  });

  it('renders sender info', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
  });

  it('renders assigned agent', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getAllByText('Agent One').length).toBeGreaterThan(0);
  });

  it('shows Unassigned when no agent assigned', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { ...mockTicket, assignedTo: null } });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders original message body', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('I placed an order 5 days ago and it has not arrived yet.')).toBeInTheDocument();
  });

  it('renders AI summary and suggested reply', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Customer reports missing order placed 5 days ago.')).toBeInTheDocument();
    expect(screen.getByText('Hi Alice, we are looking into your order right away.')).toBeInTheDocument();
  });

  it('does not render AI Insights section when both fields are null', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      data: { ...mockTicket, aiSummary: null, aiSuggestedReply: null },
    });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.queryByText('AI Insights')).not.toBeInTheDocument();
  });

  it('renders messages thread', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Any update on my order?')).toBeInTheDocument();
    expect(screen.getByText('We are checking with the warehouse.')).toBeInTheDocument();
    expect(screen.getAllByText('Agent One').length).toBeGreaterThan(0);
  });

  it('does not render Messages section when there are no messages', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: { ...mockTicket, messages: [] } });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });

  it('renders a back link to /tickets', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets');
  });

  it('calls the correct endpoint', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: mockTicket });
    renderDetail('ticket-1');

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets/ticket-1', { withCredentials: true });
  });
});
