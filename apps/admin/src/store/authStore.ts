import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'AFFILIATE' | 'ADMIN' | 'DELIVERY_AGENT' | 'SUPER_ADMIN';
  referralCode?: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setSession: (token, user) => set({
        accessToken: token,
        user,
        isAuthenticated: true,
      }),
      logout: () => set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'mangosteen-admin-auth',
    }
  )
);
