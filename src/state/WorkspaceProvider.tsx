import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { isStorageAvailable, loadWorkspace, saveWorkspace } from './storage';
import { reduce } from './workspace';
import { WorkspaceContext } from './WorkspaceContext';
import type { Workspace } from '@shared/plan';

export function WorkspaceProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Workspace;
}): React.JSX.Element {
  const [workspace, dispatch] = useReducer(reduce, initial, (given) => given ?? loadWorkspace());
  // Asked once, at start-up, rather than set from inside an effect.
  const [persisted] = useState(isStorageAvailable);

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  const value = useMemo(() => ({ workspace, dispatch, persisted }), [workspace, persisted]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
