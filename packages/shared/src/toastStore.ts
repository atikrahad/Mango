import { create } from 'zustand';

export interface ToastState {
  message: string | null;
  type: 'success' | 'info' | 'error';
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  showToast: (message, type = 'success') => {
    set({ message, type });
    setTimeout(() => {
      set((state) => (state.message === message ? { message: null } : {}));
    }, 4000);
  },
  hideToast: () => set({ message: null }),
}));
