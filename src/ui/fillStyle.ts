import type { CSSProperties } from 'react';

/** The slider track draws its filled portion from this custom property. */
export interface FillStyle extends CSSProperties {
  '--fill': string;
}

export function fillStyle(fraction: number): FillStyle {
  const clamped = Math.min(100, Math.max(0, fraction * 100));
  return { '--fill': `${String(Math.round(clamped))}%` };
}
