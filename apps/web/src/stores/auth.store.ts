import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string; role: string } | null;
  token: string | null;
  mustChangePassword: boolean;
  setAuth: (
    user: { id: string; email: string; role: string },
    token: string,
    mustChangePassword?: boolean,
  ) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  mustChangePassword: false,
  setAuth: (user, token, mustChangePassword = false) =>
    set({ user, token, mustChangePassword }),
  logout: () => set({ user: null, token: null, mustChangePassword: false }),
}));
