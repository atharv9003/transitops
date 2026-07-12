import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: number;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  role: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      setAuth: (token, user) => set({ token, user, role: user.role }),
      logout: () => set({ token: null, user: null, role: null }),
    }),
    { name: 'transitops-auth' }
  )
);
