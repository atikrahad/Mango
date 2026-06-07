import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LanguageType = 'bn' | 'en';

interface LanguageState {
  lang: LanguageType;
  hasDetected: boolean;
  setLang: (lang: LanguageType) => void;
  detectLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'bn', // Default language is Bangla as requested
      hasDetected: false,
      setLang: (lang) => set({ lang }),
      detectLanguage: async () => {
        // If the language has already been detected or manually configured, we skip auto-detection
        if (get().hasDetected) return;
        if (typeof window === 'undefined') return;

        let isBangladesh = true;

        // 1. Timezone-based country check
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz) {
            if (tz === 'Asia/Dhaka' || tz.includes('Dhaka')) {
              isBangladesh = true;
            } else {
              // Timezone is set and is NOT Bangladesh
              isBangladesh = false;
            }
          }
        } catch (e) {}

        // 2. Browser preferred language check
        try {
          const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);
          if (browserLang) {
            const bl = browserLang.toLowerCase();
            if (bl.startsWith('bn') || bl.includes('bd')) {
              isBangladesh = true;
            }
          }
        } catch (e) {}

        // 3. Fallback IP Geo API call with 1.5s timeout
        try {
          const res = await Promise.race([
            fetch('https://ipapi.co/json/').then((r) => r.json()),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
          ]);
          if (res && res.country_code) {
            isBangladesh = res.country_code === 'BD';
          }
        } catch (e) {
          // If the network call fails or times out, we rely on the timezone/browser lang results
        }

        set({ lang: isBangladesh ? 'bn' : 'en', hasDetected: true });
      },
    }),
    {
      name: 'mangosteen-language',
      partialize: (state) => ({ lang: state.lang, hasDetected: state.hasDetected }),
    }
  )
);
