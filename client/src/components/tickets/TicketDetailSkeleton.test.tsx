import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TicketDetailSkeleton } from './TicketDetailSkeleton';

describe('TicketDetailSkeleton', () => {
  it('renders skeleton pulse elements', () => {
    render(<TicketDetailSkeleton />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders multiple skeleton lines', () => {
    render(<TicketDetailSkeleton />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});
