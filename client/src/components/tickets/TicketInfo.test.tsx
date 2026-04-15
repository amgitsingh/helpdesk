import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { TicketInfo } from './TicketInfo';
import { TicketStatus, TicketCategory, type TicketDetail } from '@helpdesk/core';

const mockTicket: TicketDetail = {
  id: 'ticket-1',
  subject: 'My order is missing',
  body: 'I placed an order 5 days ago and it has not arrived.',
  senderEmail: 'alice@example.com',
  senderName: 'Alice Smith',
  status: TicketStatus.open,
  category: TicketCategory.general_question,
  assignedTo: { id: 'u1', name: 'Agent One' },
  aiSummary: 'Customer reports missing order.',
  aiSuggestedReply: 'We are looking into it.',
  createdAt: '2024-03-15T10:00:00.000Z',
  updatedAt: '2024-03-16T09:00:00.000Z',
  messages: [],
};

const mockAgents = [
  { id: 'u1', name: 'Agent One' },
  { id: 'u2', name: 'Agent Two' },
];

function renderInfo(
  overrides: Partial<TicketDetail> = {},
  handlers: {
    onAssignChange?: (v: string) => void;
    onStatusChange?: (v: string) => void;
    onCategoryChange?: (v: string) => void;
  } = {},
) {
  const ticket = { ...mockTicket, ...overrides };
  return render(
    <TicketInfo
      ticket={ticket}
      agents={mockAgents}
      isUpdating={false}
      onAssignChange={handlers.onAssignChange ?? vi.fn()}
      onStatusChange={handlers.onStatusChange ?? vi.fn()}
      onCategoryChange={handlers.onCategoryChange ?? vi.fn()}
    />,
  );
}

describe('TicketInfo', () => {
  it('renders the ticket subject', () => {
    renderInfo();
    expect(screen.getByText('My order is missing')).toBeInTheDocument();
  });

  it('renders sender name and email', () => {
    renderInfo();
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
  });

  it('renders the original message body', () => {
    renderInfo();
    expect(screen.getByText('I placed an order 5 days ago and it has not arrived.')).toBeInTheDocument();
  });

  it('renders the current status in the status select', () => {
    renderInfo();
    expect(screen.getByRole('combobox', { name: /update status/i })).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders the current category in the category select', () => {
    renderInfo();
    expect(screen.getByRole('combobox', { name: /update category/i })).toBeInTheDocument();
    expect(screen.getByText('General Question')).toBeInTheDocument();
  });

  it('renders the assigned agent name in the assign select', () => {
    renderInfo();
    expect(screen.getByRole('combobox', { name: /assign agent/i })).toBeInTheDocument();
    expect(screen.getAllByText('Agent One').length).toBeGreaterThan(0);
  });

  it('shows "Unassigned" when no agent is assigned', () => {
    renderInfo({ assignedTo: null });
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows "No category" when category is null', () => {
    renderInfo({ category: null });
    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('disables all selects when isUpdating is true', () => {
    render(
      <TicketInfo
        ticket={mockTicket}
        agents={mockAgents}
        isUpdating={true}
        onAssignChange={vi.fn()}
        onStatusChange={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );
    const combos = screen.getAllByRole('combobox');
    combos.forEach((combo) => expect(combo).toBeDisabled());
  });

  it('calls onStatusChange with the new value when status is changed', async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    renderInfo({}, { onStatusChange });

    await user.click(screen.getByRole('combobox', { name: /update status/i }));
    await user.click(screen.getByRole('option', { name: 'Resolved' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('resolved'));
  });

  it('calls onCategoryChange with the new value when category is changed', async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    renderInfo({}, { onCategoryChange });

    await user.click(screen.getByRole('combobox', { name: /update category/i }));
    await user.click(screen.getByRole('option', { name: 'Refund Request' }));

    await waitFor(() => expect(onCategoryChange).toHaveBeenCalledWith('refund_request'));
  });

  it('calls onAssignChange with agent id when an agent is selected', async () => {
    const user = userEvent.setup();
    const onAssignChange = vi.fn();
    renderInfo({ assignedTo: null }, { onAssignChange });

    await user.click(screen.getByRole('combobox', { name: /assign agent/i }));
    await user.click(screen.getByRole('option', { name: 'Agent Two' }));

    await waitFor(() => expect(onAssignChange).toHaveBeenCalledWith('u2'));
  });

  it('renders AI Insights section when aiSummary is present', () => {
    renderInfo();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Customer reports missing order.')).toBeInTheDocument();
  });

  it('renders suggested reply when aiSuggestedReply is present', () => {
    renderInfo();
    expect(screen.getByText('We are looking into it.')).toBeInTheDocument();
  });

  it('does not render AI Insights section when both AI fields are null', () => {
    renderInfo({ aiSummary: null, aiSuggestedReply: null });
    expect(screen.queryByText('AI Insights')).not.toBeInTheDocument();
  });
});
