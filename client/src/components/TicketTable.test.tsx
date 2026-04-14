import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { TicketTable } from './TicketTable';
import { renderWithClient } from '@/test/renderWithClient';
import { TicketStatus, TicketCategory, type Ticket } from '@helpdesk/core';

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

function renderTable(
  tickets: Ticket[] = mockTickets,
  isPending = false,
  isError = false,
) {
  return renderWithClient(
    <TicketTable tickets={tickets} isPending={isPending} isError={isError} />,
  );
}

describe('TicketTable — loading state', () => {
  it('shows skeletons while isPending', () => {
    renderTable([], true, false);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not show the table while isPending', () => {
    renderTable([], true, false);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('TicketTable — error state', () => {
  it('shows the error message when isError', () => {
    renderTable([], false, true);
    expect(screen.getByText('Failed to load tickets.')).toBeInTheDocument();
  });

  it('does not show the table when isError', () => {
    renderTable([], false, true);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('TicketTable — empty state', () => {
  it('shows "No tickets found." when the list is empty', () => {
    renderTable([]);
    expect(screen.getByText('No tickets found.')).toBeInTheDocument();
  });
});

describe('TicketTable — columns', () => {
  it('renders the expected column headers', () => {
    renderTable();
    expect(screen.getByRole('columnheader', { name: 'Subject' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Sender' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Created' })).toBeInTheDocument();
  });
});

describe('TicketTable — ticket data', () => {
  it('renders the subject for each ticket', () => {
    renderTable();
    expect(screen.getByText('My order is missing')).toBeInTheDocument();
    expect(screen.getByText('Billing issue')).toBeInTheDocument();
  });

  it('renders the sender name for each ticket', () => {
    renderTable();
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Bob Jones/)).toBeInTheDocument();
  });

  it('renders the sender email for each ticket', () => {
    renderTable();
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/bob@example\.com/)).toBeInTheDocument();
  });

  it('renders a formatted created date for each ticket', () => {
    renderTable();
    expect(
      screen.getByText(new Date('2024-03-15T10:00:00.000Z').toLocaleDateString()),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date('2024-01-20T08:00:00.000Z').toLocaleDateString()),
    ).toBeInTheDocument();
  });
});

describe('TicketTable — status badges', () => {
  it('renders "Open" badge for TicketStatus.open', () => {
    renderTable([{ ...mockTickets[0], status: TicketStatus.open }]);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders "Resolved" badge for TicketStatus.resolved', () => {
    renderTable([{ ...mockTickets[0], status: TicketStatus.resolved }]);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders "Closed" badge for TicketStatus.closed', () => {
    renderTable([{ ...mockTickets[0], status: TicketStatus.closed }]);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

describe('TicketTable — category labels', () => {
  it('renders "General Question" for TicketCategory.general_question', () => {
    renderTable([{ ...mockTickets[0], category: TicketCategory.general_question }]);
    expect(screen.getByText('General Question')).toBeInTheDocument();
  });

  it('renders "Technical Question" for TicketCategory.technical_question', () => {
    renderTable([{ ...mockTickets[0], category: TicketCategory.technical_question }]);
    expect(screen.getByText('Technical Question')).toBeInTheDocument();
  });

  it('renders "Refund Request" for TicketCategory.refund_request', () => {
    renderTable([{ ...mockTickets[0], category: TicketCategory.refund_request }]);
    expect(screen.getByText('Refund Request')).toBeInTheDocument();
  });

  it('renders "—" when category is null', () => {
    renderTable([{ ...mockTickets[0], category: null }]);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
