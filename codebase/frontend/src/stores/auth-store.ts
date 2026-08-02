import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Workspace {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      currentWorkspace: null,
      workspaces: [],
      setAuth: (user, token) => set({ user, accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null, currentWorkspace: null, workspaces: [] }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
    }),
    {
      name: 'jagu-auth-storage',
    },
  ),
);
