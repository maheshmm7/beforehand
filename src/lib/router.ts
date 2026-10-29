import { useCallback, useEffect, useState } from 'react';

export const VIEWS = ['budget', 'timeline', 'vendors', 'ideas'] as const;
export type View = (typeof VIEWS)[number];

export type Route =
  | { readonly name: 'home' }
  | { readonly name: 'new' }
  | { readonly name: 'about' }
  | { readonly name: 'privacy' }
  | { readonly name: 'plan'; readonly planId: string; readonly view: View }
  | { readonly name: 'notFound' };

function isView(value: string): value is View {
  return VIEWS.some((view) => view === value);
}

/**
 * Hash routing: no router dependency, and back and forward work for free.
 *
 * Every route begins `#/`. A bare `#name` is an in-page anchor, not an
 * address, so it leaves the landing page where it is and lets the browser
 * scroll to it.
 */
export function parseRoute(hash: string): Route {
  if (hash !== '' && hash !== '#' && !hash.startsWith('#/')) return { name: 'home' };

  const path = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  if (path === '') return { name: 'home' };

  const parts = path.split('/').map((part) => decodeURIComponent(part));
  const [first, second, third] = parts;

  if (first === 'new' && parts.length === 1) return { name: 'new' };
  if (first === 'about' && parts.length === 1) return { name: 'about' };
  if (first === 'privacy' && parts.length === 1) return { name: 'privacy' };

  if (first === 'plan' && second !== undefined && second !== '') {
    const view = third ?? 'budget';
    if (parts.length <= 3 && isView(view)) return { name: 'plan', planId: second, view };
  }

  return { name: 'notFound' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'new':
      return '#/new';
    case 'about':
      return '#/about';
    case 'privacy':
      return '#/privacy';
    case 'plan':
      return `#/plan/${encodeURIComponent(route.planId)}/${route.view}`;
    case 'notFound':
      return '#/';
  }
}

function currentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash;
}

export function useRoute(): Route {
  const [hash, setHash] = useState(currentHash);

  useEffect(() => {
    const onChange = (): void => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  return parseRoute(hash);
}

export function useNavigate(): (route: Route) => void {
  return useCallback((route: Route) => {
    window.location.hash = hrefFor(route);
  }, []);
}
