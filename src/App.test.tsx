import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { WorkspaceProvider } from './state/WorkspaceProvider';
import { emptyWorkspace } from '@shared/plan';

function show(hash: string): void {
  window.location.hash = hash;
  render(
    <WorkspaceProvider initial={emptyWorkspace}>
      <App />
    </WorkspaceProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('opens on the landing page', () => {
    show('#/');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /know what a decision costs/i,
    );
  });

  it('sets the document language before paint', () => {
    show('#/');

    expect(document.documentElement.lang).toBe('en');
  });

  it('offers a skip link as the first thing a keyboard reaches', () => {
    show('#/');

    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });

  it('shows the new plan form', () => {
    show('#/new');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Start a plan');
  });

  it('explains the approach on the about page', () => {
    show('#/about');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('How Beforehand works');
  });

  it('says plainly where data lives', () => {
    show('#/privacy');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Privacy');
  });

  it('says so when a plan id is not in this browser', () => {
    show('#/plan/missing/budget');

    expect(screen.getByText('That plan is not in this browser.')).toBeInTheDocument();
  });

  it('says so for an address that does not exist', () => {
    show('#/nowhere');

    expect(screen.getByText('There is nothing at that address.')).toBeInTheDocument();
  });
});
