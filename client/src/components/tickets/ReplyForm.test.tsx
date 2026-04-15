import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReplyForm } from './ReplyForm';

function renderForm(props: Partial<React.ComponentProps<typeof ReplyForm>> = {}) {
  const defaults = {
    onSubmit: vi.fn(),
    isPending: false,
    isError: false,
  };
  return render(<ReplyForm {...defaults} {...props} />);
}

describe('ReplyForm', () => {
  it('renders a textarea and submit button', () => {
    renderForm();
    expect(screen.getByRole('textbox', { name: /reply body/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reply/i })).toBeInTheDocument();
  });

  it('button is disabled when textarea is empty', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /send reply/i })).toBeDisabled();
  });

  it('button is enabled once text is entered', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByRole('textbox', { name: /reply body/i }), 'Hello');
    expect(screen.getByRole('button', { name: /send reply/i })).toBeEnabled();
  });

  it('button is disabled for whitespace-only input', async () => {
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

  it('button is disabled when isPending regardless of body content', () => {
    renderForm({ isPending: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows error message when isError is true', () => {
    renderForm({ isError: true });
    expect(screen.getByText('Failed to send reply. Please try again.')).toBeInTheDocument();
  });

  it('does not show error message when isError is false', () => {
    renderForm({ isError: false });
    expect(screen.queryByText('Failed to send reply. Please try again.')).not.toBeInTheDocument();
  });
});
