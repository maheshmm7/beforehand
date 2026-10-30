import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Money } from './Money';

// vitest.setup reports reduced motion, so the figure is exact on every render
// rather than part way through an animation.

describe('Money', () => {
  it('writes the exact amount', () => {
    render(<Money amount={1269775} />);

    expect(screen.getByText('₹12,69,775')).toBeInTheDocument();
  });

  it('shortens a headline figure when asked', () => {
    render(<Money amount={1269775} shape="short" />);

    expect(screen.getByText('₹12.7L')).toBeInTheDocument();
  });

  it('signs a difference', () => {
    render(<Money amount={76275} shape="signed" />);

    expect(screen.getByText('+₹76,275')).toBeInTheDocument();
  });

  it('lands on the new figure when the amount changes', () => {
    const { rerender } = render(<Money amount={100} />);
    rerender(<Money amount={999} />);

    expect(screen.getByText('₹999')).toBeInTheDocument();
  });

  it('carries a class through so it can be styled where it is used', () => {
    render(<Money amount={5} className="headline" />);

    expect(screen.getByText('₹5')).toHaveClass('headline');
  });
});
