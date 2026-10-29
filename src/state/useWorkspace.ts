import { useContext } from 'react';
import { WorkspaceContext, type WorkspaceStore } from './WorkspaceContext';

export function useWorkspace(): WorkspaceStore {
  return useContext(WorkspaceContext);
}
