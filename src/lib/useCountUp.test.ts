import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

/**
 * Unit tests report reduced motion so that assertions see final values, which
 * means the animated path never runs anywhere else. It is driven here with a
 * frame queue of our own, so each step can be placed exactly in time.
 */
function withMotion(): FrameRequestCallback[] {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: false, media: query }) as MediaQueryList,
  );
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  return frames;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useCountUp', () => {
  it('shows the exact figure at once when motion is not wanted', () => {
    const { result, rerender } = renderHook(({ to }) => useCountUp(to), {
      initialProps: { to: 100 },
    });

    rerender({ to: 250 });

    expect(result.current).toBe(250);
  });

  it('counts from where it was to where it is going', () => {
    const frames = withMotion();
    const { result, rerender } = renderHook(({ to }) => useCountUp(to), {
      initialProps: { to: 100 },
    });
    expect(result.current).toBe(100);

    rerender({ to: 200 });
    const began = performance.now();

    // Part way: somewhere between the two, and not either of them.
    act(() => {
      frames.shift()?.(began + 200);
    });
    expect(result.current).toBeGreaterThan(100);
    expect(result.current).toBeLessThan(200);

    // Past the end: exactly the target, never an eased approximation of it.
    act(() => {
      frames.shift()?.(began + 5000);
    });
    expect(result.current).toBe(200);
  });

  it('starts the next count from the figure it reached', () => {
    const frames = withMotion();
    const { result, rerender } = renderHook(({ to }) => useCountUp(to), {
      initialProps: { to: 0 },
    });

    rerender({ to: 100 });
    act(() => {
      frames.shift()?.(performance.now() + 5000);
    });
    expect(result.current).toBe(100);

    rerender({ to: 300 });
    act(() => {
      frames.shift()?.(performance.now() + 5000);
    });
    expect(result.current).toBe(300);
  });

  it('does nothing at all when the figure has not moved', () => {
    const frames = withMotion();
    const { result, rerender } = renderHook(({ to }) => useCountUp(to), {
      initialProps: { to: 42 },
    });

    rerender({ to: 42 });

    expect(frames).toHaveLength(0);
    expect(result.current).toBe(42);
  });

  it('shows the figure plainly where there is no frame loop to animate with', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);

    const { result } = renderHook(() => useCountUp(7));

    expect(result.current).toBe(7);
  });
});
