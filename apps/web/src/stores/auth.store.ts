import { create } from 'zustand';

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'expired' | 'offline' | 'takeover' | 'error';

export interface AuthUser {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: SessionStatus;
  error: string | null;
  mustChangePassword: boolean;
  sessionCount: number;

  setAuth: (
    user: AuthUser,
    token: string,
    mustChangePassword?: boolean,
  ) => void;
  setStatus: (status: SessionStatus) => void;
  setError: (error: string | null) => void;
  hydrate: (
    user: AuthUser,
    token: string,
    mustChangePassword?: boolean,
  ) => void;
  setAuthFailed: (error: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: 'idle',
  error: null,
  mustChangePassword: false,
  sessionCount: 0,

  setAuth: (user, token, mustChangePassword = false) =>
    set((state) => ({
      user,
      token,
      mustChangePassword,
      status: 'authenticated',
      error: null,
      sessionCount: state.sessionCount + 1,
    })),

  setStatus: (status) => set({ status }),

  setError: (error) => set({ error }),

  hydrate: (user, token, mustChangePassword = false) =>
    set({
      user,
      token,
      mustChangePassword,
      status: 'authenticated',
      error: null,
    }),

  setAuthFailed: (error) => {
    if (typeof window !== 'undefined') {
      console.group('[AUTH EVENT] setAuthFailed');
      console.trace();
      const s = useAuthStore.getState();
      console.log('previous status:', s.status);
      console.log('user id:', s.user?.id);
      console.log('reason:', error);
      console.log('timestamp:', new Date().toISOString());
      console.groupEnd();
    }
    set({ status: 'error', error, user: null, token: null });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      console.group('[AUTH EVENT] store.logout');
      console.trace();
      const s = useAuthStore.getState();
      console.log('current status:', s.status);
      console.log('user id:', s.user?.id);
      console.log('timestamp:', new Date().toISOString());
      console.groupEnd();
    }
    set({
      user: null,
      token: null,
      status: 'idle',
      error: null,
      mustChangePassword: false,
    });
  },
}));
