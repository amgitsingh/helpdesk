import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageThread } from './MessageThread';
import { type TicketMessage } from '@helpdesk/core';

const customerMsg: TicketMessage = {
  id: 'msg-1',
  body: 'Where is my order?',
  sender: 'customer',
  sentAt: '2024-03-16T08:00:00.000Z',
  user: null,
};

const agentMsg: TicketMessage = {
  id: 'msg-2',
  body: 'We are looking into it.',
  sender: 'agent',
  sentAt: '2024-03-16T09:00:00.000Z',
  user: { id: 'u1', name: 'Agent One' },
};

const aiMsg: TicketMessage = {
  id: 'msg-3',
  body: 'Suggested reply from AI.',
  sender: 'ai',
  sentAt: '2024-03-16T09:30:00.000Z',
  user: null,
};

describe('MessageThread', () => {
  it('renders nothing when messages array is empty', () => {
    const { container } = render(<MessageThread messages={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render the Messages heading for empty messages', () => {
    render(<MessageThread messages={[]} />);
    expect(screen.queryByText('Messages')).not.toBeInTheDocument();
  });

  it('renders the Messages heading when there are messages', () => {
    render(<MessageThread messages={[customerMsg]} />);
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders message body text', () => {
    render(<MessageThread messages={[customerMsg, agentMsg]} />);
    expect(screen.getByText('Where is my order?')).toBeInTheDocument();
    expect(screen.getByText('We are looking into it.')).toBeInTheDocument();
  });

  it('shows "Customer" label for messages with no user', () => {
    render(<MessageThread messages={[customerMsg]} />);
    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('shows the user name for agent messages', () => {
    render(<MessageThread messages={[agentMsg]} />);
    expect(screen.getByText('Agent One')).toBeInTheDocument();
  });

  it('shows "AI" label for ai messages with no user', () => {
    render(<MessageThread messages={[aiMsg]} />);
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('applies left-aligned styles to customer messages', () => {
    render(<MessageThread messages={[customerMsg]} />);
    const bubble = screen.getByText('Where is my order?').closest('[class*="rounded-md"]');
    expect(bubble?.className).toContain('bg-muted');
  });

  it('applies right-aligned styles to agent messages', () => {
    render(<MessageThread messages={[agentMsg]} />);
    const bubble = screen.getByText('We are looking into it.').closest('[class*="rounded-md"]');
    expect(bubble?.className).toContain('bg-primary');
  });

  it('applies violet styles to AI messages', () => {
    render(<MessageThread messages={[aiMsg]} />);
    const bubble = screen.getByText('Suggested reply from AI.').closest('[class*="rounded-md"]');
    expect(bubble?.className).toContain('bg-violet');
  });

  it('renders all messages in the list', () => {
    render(<MessageThread messages={[customerMsg, agentMsg, aiMsg]} />);
    expect(screen.getByText('Where is my order?')).toBeInTheDocument();
    expect(screen.getByText('We are looking into it.')).toBeInTheDocument();
    expect(screen.getByText('Suggested reply from AI.')).toBeInTheDocument();
  });
});
