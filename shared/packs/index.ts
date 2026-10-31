import type { EventKind, EventPack, VariableValues } from '../engine/types.ts';
import { birthdayPack } from './birthday.ts';
import { communityPack } from './community.ts';
import { weddingPack } from './wedding.ts';

/** One engine, three packs. The difference between the event types is data. */
export const packs: Readonly<Record<EventKind, EventPack>> = {
  wedding: weddingPack,
  birthday: birthdayPack,
  community: communityPack,
};

export const packList: readonly EventPack[] = [weddingPack, birthdayPack, communityPack];

export function packFor(kind: EventKind): EventPack {
  return packs[kind];
}

/** The values a brand new plan starts from. */
export function defaultValues(pack: EventPack): VariableValues {
  const values: Record<string, number | string> = {};
  for (const variable of pack.variables) values[variable.id] = variable.fallback;
  return values;
}

export { birthdayPack, communityPack, weddingPack };
