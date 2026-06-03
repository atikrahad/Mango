import { createAuthStore } from '@mangosteen/shared';
export type { UserProfile, AuthState } from '@mangosteen/shared';

export const useAuthStore = createAuthStore('mangosteen-auth');

