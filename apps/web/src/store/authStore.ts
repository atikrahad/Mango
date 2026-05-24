import { create } from 'zustand';

interface UserProfile {
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

export const useAuthStore = create<AuthState>((set) => ({
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
}));
