import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyWorkspace } from '@shared/plan';
import { WorkspaceContext } from './WorkspaceContext';
import { WorkspaceProvider } from './WorkspaceProvider';
import { newPlan } from './workspace';

function Report(): React.JSX.Element {
  const { workspace, persisted, dispatch } = useContext(WorkspaceContext);
  return (
    <div>
      <p data-testid="count">{workspace.plans.length}</p>
      <p data-testid="persisted">{persisted ? 'kept' : 'not kept'}</p>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: 'selectPlan', planId: null });
        }}
      >
        Dispatch
      </button>
    </div>
  );
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('WorkspaceProvider', () => {
  it('starts from what this browser kept', () => {
    const plan = newPlan({
      id: 'p1',
      scenarioId: 's1',
      name: 'Priya and Arjun',
      kind: 'wedding',
      place: 'Hyderabad',
      eventDateIso: '2027-03-02',
      anchorTime: '09:30',
    });
    window.localStorage.setItem(
      'beforehand.workspace.v1',
      JSON.stringify({ version: 1, plans: [plan], activePlanId: 'p1' }),
    );

    render(
      <WorkspaceProvider>
        <Report />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('persisted')).toHaveTextContent('kept');
  });

  it('starts from what it was given, over what was kept', () => {
    window.localStorage.setItem(
      'beforehand.workspace.v1',
      JSON.stringify({ version: 1, plans: [{ bad: true }], activePlanId: null }),
    );

    render(
      <WorkspaceProvider initial={emptyWorkspace}>
        <Report />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('says so when this browser refuses to keep anything', () => {
    // A private window, a full quota, or blocked site data.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    render(
      <WorkspaceProvider>
        <Report />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId('persisted')).toHaveTextContent('not kept');
  });

  it('writes every change back without being asked', () => {
    render(
      <WorkspaceProvider initial={emptyWorkspace}>
        <Report />
      </WorkspaceProvider>,
    );

    expect(window.localStorage.getItem('beforehand.workspace.v1')).toContain('"plans":[]');
  });
});

describe('the context with no provider around it', () => {
  it('reads as empty and swallows a dispatch rather than throwing', () => {
    render(<Report />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('persisted')).toHaveTextContent('kept');
    // Nothing is listening, and nothing breaks.
    expect(() => {
      screen.getByRole('button', { name: 'Dispatch' }).click();
    }).not.toThrow();
  });
});
