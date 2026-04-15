import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackLink } from './back-link';

function renderBackLink(to: string, label: string) {
  return render(
    <MemoryRouter>
      <BackLink to={to} label={label} />
    </MemoryRouter>,
  );
}

describe('BackLink', () => {
  it('renders the label text', () => {
    renderBackLink('/tickets', 'Back to tickets');
    expect(screen.getByText('Back to tickets')).toBeInTheDocument();
  });

  it('renders a link with the correct href', () => {
    renderBackLink('/tickets', 'Back to tickets');
    expect(screen.getByRole('link', { name: /back to tickets/i })).toHaveAttribute('href', '/tickets');
  });

  it('renders an arrow icon', () => {
    renderBackLink('/tickets', 'Back to tickets');
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('accepts an arbitrary destination and label', () => {
    renderBackLink('/users', 'Back to users');
    expect(screen.getByRole('link', { name: /back to users/i })).toHaveAttribute('href', '/users');
  });
});
