import { emptyWorkspace, workspaceSchema, type Workspace } from '@shared/plan';

const KEY = 'beforehand.workspace.v1';

/**
 * Plans live in this browser and nowhere else: no account, no server, nothing
 * about an event leaves the device unless the planner asks the assistant a
 * question. Storage can be unavailable or hold something stale, so every read
 * is validated and every failure falls back to an empty workspace.
 */
export function loadWorkspace(storage: Storage | undefined = safeStorage()): Workspace {
  if (storage === undefined) return emptyWorkspace;

  let raw: string | null = null;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return emptyWorkspace;
  }
  if (raw === null) return emptyWorkspace;

  try {
    const parsed = workspaceSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyWorkspace;
  } catch {
    return emptyWorkspace;
  }
}

export function saveWorkspace(
  workspace: Workspace,
  storage: Storage | undefined = safeStorage(),
): boolean {
  if (storage === undefined) return false;
  try {
    storage.setItem(KEY, JSON.stringify(workspace));
    return true;
  } catch {
    // A private window, a full quota, or blocked site data. The app keeps
    // working for this session; it just will not be here next time.
    return false;
  }
}

export function isStorageAvailable(storage: Storage | undefined = safeStorage()): boolean {
  if (storage === undefined) return false;
  try {
    const probe = `${KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
