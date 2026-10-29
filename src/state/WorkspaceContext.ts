import { createContext } from 'react';
import { emptyWorkspace, type Workspace } from '@shared/plan';
import type { Action } from './workspace';

export interface WorkspaceStore {
  readonly workspace: Workspace;
  readonly dispatch: (action: Action) => void;
  /** False when this browser refused to keep the plans, so the app can say so. */
  readonly persisted: boolean;
}

export const WorkspaceContext = createContext<WorkspaceStore>({
  workspace: emptyWorkspace,
  dispatch: () => undefined,
  persisted: true,
});
