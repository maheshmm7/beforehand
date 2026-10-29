import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyWorkspace, type Workspace } from '@shared/plan';
import { isStorageAvailable, loadWorkspace, saveWorkspace } from './storage';
import { newPlan, reduce } from './workspace';

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

function refusingStorage(): Storage {
  const refuse = (): never => {
    throw new Error('blocked');
  };
  return {
    get length(): number {
      return 0;
    },
    clear: refuse,
    getItem: refuse,
    key: () => null,
    removeItem: refuse,
    setItem: refuse,
  };
}

const KEY = 'beforehand.workspace.v1';

afterEach(() => {
  vi.unstubAllGlobals();
});

function populated(): Workspace {
  return reduce(emptyWorkspace, {
    type: 'createPlan',
    plan: newPlan({
      id: 'p1',
      scenarioId: 's1',
      name: 'Priya and Arjun',
      kind: 'wedding',
      place: 'Hyderabad',
      eventDateIso: '2027-03-02',
      anchorTime: '09:30',
    }),
  });
}

describe('loadWorkspace', () => {
  it('returns an empty workspace when there is nothing stored', () => {
    expect(loadWorkspace(fakeStorage())).toEqual(emptyWorkspace);
  });

  it('round-trips a real workspace', () => {
    const storage = fakeStorage();
    const workspace = populated();

    expect(saveWorkspace(workspace, storage)).toBe(true);
    expect(loadWorkspace(storage)).toEqual(workspace);
  });

  it('discards stored data that does not match the schema', () => {
    const storage = fakeStorage({ [KEY]: JSON.stringify({ version: 99, plans: 'lots' }) });

    expect(loadWorkspace(storage)).toEqual(emptyWorkspace);
  });

  it('discards a plan carrying a field it should not have', () => {
    const workspace = populated();
    const tampered = {
      ...workspace,
      plans: [{ ...workspace.plans[0], surprise: true }],
    };
    const storage = fakeStorage({ [KEY]: JSON.stringify(tampered) });

    expect(loadWorkspace(storage)).toEqual(emptyWorkspace);
  });

  it('survives text that is not json at all', () => {
    expect(loadWorkspace(fakeStorage({ [KEY]: 'not json' }))).toEqual(emptyWorkspace);
  });

  it('survives storage that refuses to be read', () => {
    expect(loadWorkspace(refusingStorage())).toEqual(emptyWorkspace);
  });

  it('survives a browser with no storage at all', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(loadWorkspace()).toEqual(emptyWorkspace);
    expect(saveWorkspace(populated())).toBe(false);
    expect(isStorageAvailable()).toBe(false);
  });
});

describe('saveWorkspace', () => {
  it('reports failure rather than throwing when storage refuses', () => {
    expect(saveWorkspace(emptyWorkspace, refusingStorage())).toBe(false);
  });
});

describe('isStorageAvailable', () => {
  it('is true for working storage and false when it refuses', () => {
    expect(isStorageAvailable(fakeStorage())).toBe(true);
    expect(isStorageAvailable(refusingStorage())).toBe(false);
  });

  it('leaves nothing behind when it checks', () => {
    const storage = fakeStorage();
    isStorageAvailable(storage);

    expect(storage.length).toBe(0);
  });
});
