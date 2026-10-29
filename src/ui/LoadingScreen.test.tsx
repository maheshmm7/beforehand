import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('announces itself to assistive technology', () => {
    render(<LoadingScreen />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Loading');
  });

  it('takes a caller-supplied label', () => {
    render(<LoadingScreen label="Working out the knock-on costs" />);

    expect(screen.getByRole('status')).toHaveTextContent('Working out the knock-on costs');
  });
});
