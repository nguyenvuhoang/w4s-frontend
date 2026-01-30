// Config Imports
import { i18n } from '@configs/i18n'
import en from "@/data/dictionaries/en.json";
import vi from "@/data/dictionaries/vi.json";
import la from "@/data/dictionaries/la.json";

// Util Imports
import { ensurePrefix } from '@utils/string'

// Check if the url is missing the locale
export const isUrlMissingLocale = (url: string) => {
  return i18n.locales.every(locale => !(url.startsWith(`/${locale}/`) || url === `/${locale}`))
}

export const localeMessages: any = {
  "en": en,
  "vi": vi,
  "la": la
};

// Get the localized url
export const getLocalizedUrl = (url: string, languageCode: string): string => {
  if (!url || !languageCode) {
    console.warn('getLocalizedUrl called with invalid parameters:', { url, languageCode });
    return url || '/'; // fallback safely
  }

  return isUrlMissingLocale(url) ? `/${languageCode}${ensurePrefix(url, '/')}` : url
}

