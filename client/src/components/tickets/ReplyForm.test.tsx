import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { ReplyForm } from './ReplyForm';
import { renderWithClient } from '@/test/renderWithClient';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

function renderForm(props: Partial<React.ComponentProps<typeof ReplyForm>> = {}) {
  const defaults = {
    ticketId: 'ticket-123',
    onSubmit: vi.fn(),
    isPending: false,
    isError: false,
  };
  return renderWithClient(<ReplyForm {...defaults} {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReplyForm', () => {
  it('renders a textarea and send reply button', () => {
    renderForm();
    expect(screen.getByRole('textbox', { name: /reply body/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument();
  });

  it('send reply button is disabled when textarea is empty', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
  });

  it('send reply button is enabled once text is entered', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'Hello');
    expect(screen.getByRole('button', { name: /send reply/i })).toBeEnabled();
  });

  it('send reply button is disabled for whitespace-only input', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole('textbox', { name: /reply body/i }), '   ');
    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
  });

  it('calls onSubmit with trimmed body on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    await user.type(screen.getByRole('textbox', { name: /reply body/i }), '  Hello world  ');
    await user.click(screen.getByRole('button', { name: /send reply/i }));
    expect(onSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('does not call onSubmit for whitespace-only body', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    await user.type(screen.getByRole('textbox', { name: /reply body/i }), '   ');
    await user.click(screen.getByRole('button', { name: /send reply/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables textarea and shows "Sending…" when isPending', () => {
    renderForm({ isPending: true });
    expect(screen.getByRole('textbox', { name: /reply body/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
  });

  it('send reply button is disabled when isPending regardless of body content', () => {
    renderForm({ isPending: true });
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
  });

  it('shows send error message when isError is true', () => {
    renderForm({ isError: true });
    expect(screen.getByText('Failed to send reply. Please try again.')).toBeInTheDocument();
  });

  it('does not show send error message when isError is false', () => {
    renderForm({ isError: false });
    expect(screen.queryByText('Failed to send reply. Please try again.')).not.toBeInTheDocument();
  });

  describe('Polish button', () => {
    it('renders a Polish button', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /polish/i })).toBeInTheDocument();
    });

    it('Polish button is disabled when textarea is empty', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /polish/i })).toBeDisabled();
    });

    it('Polish button is enabled when text is entered', async () => {
      const user = userEvent.setup();
      renderForm();
      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      expect(screen.getByRole('button', { name: /polish/i })).toBeEnabled();
    });

    it('calls POST /api/tickets/:id/polish-reply with current body', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { polishedBody: 'Polished text' } });
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/tickets/ticket-123/polish-reply',
          { body: 'rough draft' },
          { withCredentials: true },
        );
      });
    });

    it('updates textarea with polished text on success', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { polishedBody: 'Dear Customer, thank you for reaching out.' } });
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      await waitFor(() => {
        expect(
          (screen.getByRole('textbox', { name: /reply body/i }) as HTMLTextAreaElement).value,
        ).toBe('Dear Customer, thank you for reaching out.');
      });
    });

    it('shows "Polishing…" while request is in flight', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockReturnValue(new Promise(() => {}));
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      expect(screen.getByRole('button', { name: /polishing/i })).toBeInTheDocument();
    });

    it('disables both buttons while polishing', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockReturnValue(new Promise(() => {}));
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      expect(screen.getByRole('button', { name: /polishing/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
    });

    it('disables textarea while polishing', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockReturnValue(new Promise(() => {}));
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      expect(screen.getByRole('textbox', { name: /reply body/i })).toBeDisabled();
    });

    it('shows polish error message on failure', async () => {
      const user = userEvent.setup();
      mockedAxios.post = vi.fn().mockRejectedValue(new Error('Server error'));
      renderForm();

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to polish reply. Please try again.')).toBeInTheDocument();
      });
    });

    it('does not show polish error message initially', () => {
      renderForm();
      expect(screen.queryByText('Failed to polish reply. Please try again.')).not.toBeInTheDocument();
    });

    it('does not call onSubmit when Polish is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { polishedBody: 'Polished' } });
      renderForm({ onSubmit });

      await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'rough draft');
      await user.click(screen.getByRole('button', { name: /polish/i }));

      await waitFor(() => {
        expect(
          (screen.getByRole('textbox', { name: /reply body/i }) as HTMLTextAreaElement).value,
        ).toBe('Polished');
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
