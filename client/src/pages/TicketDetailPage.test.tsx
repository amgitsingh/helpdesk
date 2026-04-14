import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TicketDetailPage from './TicketDetailPage';
import { TicketStatus, TicketCategory, type TicketDetail } from '@helpdesk/core';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const mockAgents = [
  { id: 'u1', name: 'Agent One' },
  { id: 'u2', name: 'Agent Two' },
];

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

// Mock both GET /api/tickets/:id and GET /api/users/agents
function mockGetRequests(ticket: TicketDetail = mockTicket) {
  mockedAxios.get = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/users/agents')) return Promise.resolve({ data: mockAgents });
    return Promise.resolve({ data: ticket });
  });
}

function renderDetail(id = 'ticket-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return require('@testing-library/react').render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/tickets/${id}`]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
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
    mockGetRequests();
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText('My order is missing')).toBeInTheDocument();
    });
  });

  it('renders status select showing current status', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByRole('combobox', { name: /update status/i })).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders category select showing current category', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByRole('combobox', { name: /update category/i })).toBeInTheDocument();
    expect(screen.getByText('General Question')).toBeInTheDocument();
  });

  it('calls PATCH with new status when status is changed', async () => {
    const user = userEvent.setup();
    mockGetRequests();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: { status: 'resolved', category: 'general_question', assignedTo: null } });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /update status/i }));
    await user.click(screen.getByRole('option', { name: 'Resolved' }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/ticket-1',
        { status: 'resolved' },
        { withCredentials: true },
      );
    });
  });

  it('calls PATCH with new category when category is changed', async () => {
    const user = userEvent.setup();
    mockGetRequests();
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: { status: 'open', category: 'refund_request', assignedTo: null } });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /update category/i }));
    await user.click(screen.getByRole('option', { name: 'Refund Request' }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/ticket-1',
        { category: 'refund_request' },
        { withCredentials: true },
      );
    });
  });

  it('renders sender info', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
  });

  it('renders assign dropdown showing current agent', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByRole('combobox', { name: /assign agent/i })).toBeInTheDocument();
    expect(screen.getAllByText('Agent One').length).toBeGreaterThan(0);
  });

  it('shows Unassigned placeholder when no agent assigned', async () => {
    mockGetRequests({ ...mockTicket, assignedTo: null });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('calls PATCH with selected agent id when an agent is chosen', async () => {
    const user = userEvent.setup();
    mockGetRequests({ ...mockTicket, assignedTo: null });
    mockedAxios.patch = vi.fn().mockResolvedValue({ data: { assignedTo: { id: 'u2', name: 'Agent Two' } } });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /assign agent/i }));
    await user.click(screen.getByRole('option', { name: 'Agent Two' }));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/tickets/ticket-1',
        { assignedToId: 'u2' },
        { withCredentials: true },
      );
    });
  });

  it('renders original message body', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('I placed an order 5 days ago and it has not arrived yet.')).toBeInTheDocument();
  });

  it('renders AI summary and suggested reply', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Customer reports missing order placed 5 days ago.')).toBeInTheDocument();
    expect(screen.getByText('Hi Alice, we are looking into your order right away.')).toBeInTheDocument();
  });

  it('does not render AI Insights section when both fields are null', async () => {
    mockGetRequests({ ...mockTicket, aiSummary: null, aiSuggestedReply: null });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.queryByText('AI Insights')).not.toBeInTheDocument();
  });

  it('renders messages thread', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByText('Any update on my order?')).toBeInTheDocument();
    expect(screen.getByText('We are checking with the warehouse.')).toBeInTheDocument();
    expect(screen.getAllByText('Agent One').length).toBeGreaterThan(0);
  });

  it('does not render Messages section when there are no messages', async () => {
    mockGetRequests({ ...mockTicket, messages: [] });
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });

  it('renders a back link to /tickets', async () => {
    mockGetRequests();
    renderDetail();

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets');
  });

  it('calls the correct endpoints', async () => {
    mockGetRequests();
    renderDetail('ticket-1');

    await waitFor(() => expect(screen.getByText('My order is missing')).toBeInTheDocument());
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tickets/ticket-1', { withCredentials: true });
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/agents', { withCredentials: true });
  });
});
