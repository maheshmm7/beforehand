import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('names the promise of the product in its heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /know what a decision costs/i,
    );
  });

  it('sets the document language before paint', () => {
    render(<App />);

    expect(document.documentElement.lang).toBe('en');
  });

  it('shows the three states a cost line can be in', () => {
    render(<App />);

    for (const state of ['estimated', 'quoted', 'paid']) {
      expect(screen.getByText(state)).toBeInTheDocument();
    }
  });
});
