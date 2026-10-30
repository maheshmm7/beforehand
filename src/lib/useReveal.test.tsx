import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReveal } from './useReveal';

function Section(): React.JSX.Element {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="section">
      Something worth reading
    </div>
  );
}

interface FakeObserver {
  readonly observed: Element[];
  disconnected: boolean;
}

/** An observer we can fire by hand, standing in for the browser's. */
function stubObserver(): { last: FakeObserver | null; fire: (isIntersecting: boolean) => void } {
  const state: { last: FakeObserver | null; callback: IntersectionObserverCallback | null } = {
    last: null,
    callback: null,
  };

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observed: Element[] = [];
      disconnected = false;

      constructor(callback: IntersectionObserverCallback) {
        state.callback = callback;
        state.last = this;
      }

      observe(element: Element): void {
        this.observed.push(element);
      }

      disconnect(): void {
        this.disconnected = true;
      }
    },
  );

  return {
    get last() {
      return state.last;
    },
    fire: (isIntersecting: boolean) => {
      state.callback?.(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useReveal', () => {
  it('shows the section at once when motion is not wanted', () => {
    // The setup reports reduced motion, which is the condition under test.
    render(<Section />);

    expect(screen.getByTestId('section')).toHaveAttribute('data-reveal', 'shown');
  });

  it('shows it at once in a browser with no observer at all', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: false, media: query }) as MediaQueryList,
    );
    vi.stubGlobal('IntersectionObserver', undefined);

    render(<Section />);

    expect(screen.getByTestId('section')).toHaveAttribute('data-reveal', 'shown');
  });

  it('waits for the section to come into view, then stops watching', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: false, media: query }) as MediaQueryList,
    );
    const observer = stubObserver();

    render(<Section />);
    const section = screen.getByTestId('section');
    expect(section).not.toHaveAttribute('data-reveal');
    expect(observer.last?.observed).toHaveLength(1);

    // Scrolled past, but not into view: still nothing.
    observer.fire(false);
    expect(section).not.toHaveAttribute('data-reveal');

    observer.fire(true);
    expect(section).toHaveAttribute('data-reveal', 'shown');
    expect(observer.last?.disconnected).toBe(true);
  });

  it('stops watching when the section goes away unseen', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: false, media: query }) as MediaQueryList,
    );
    const observer = stubObserver();

    const { unmount } = render(<Section />);
    unmount();

    expect(observer.last?.disconnected).toBe(true);
  });
});
