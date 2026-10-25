import { en } from './locales/en';
import { vi } from './locales/vi';

export { en, vi };

export const defaultI18nResources = {
  en: {
    translation: en,
  },
  vi: {
    translation: vi,
  },
} as const;

export type TranslationSchema = typeof en;
export type SupportedLanguage = 'en' | 'vi';
