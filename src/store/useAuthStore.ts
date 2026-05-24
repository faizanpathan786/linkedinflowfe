import { create } from 'zustand';
import { authAPI } from '@/lib/api';
import { useLinkedInStore } from '@/store/useLinkedInStore';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  image?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Call once on app mount — hits GET /api/me to restore session */
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await authAPI.me();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // best-effort — clear state regardless
    }
    useLinkedInStore.getState().resetUserData();
    set({ user: null, isAuthenticated: false });
  },
}));
