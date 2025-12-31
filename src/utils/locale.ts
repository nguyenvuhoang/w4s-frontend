import { i18n } from '@/configs/i18n';
import type { Locale } from '@/configs/i18n';

/**
 * Utility functions for locale validation and handling
 */

/**
 * Validates if a locale string is a valid locale
 * @param locale - The locale string to validate
 * @returns true if the locale is valid, false otherwise
 */
export function isValidLocale(locale: string): locale is Locale {
  return i18n.locales.includes(locale as Locale);
}

/**
 * Gets a valid locale, falling back to default if invalid
 * @param locale - The locale string to validate
 * @returns A valid locale string
 */
export function getValidLocale(locale: string): Locale {
  if (isValidLocale(locale)) {
    return locale;
  }
  
  console.warn(`Invalid locale '${locale}' provided, falling back to default locale '${i18n.defaultLocale}'`);
  return i18n.defaultLocale;
}

/**
 * Extracts locale from a pathname with validation
 * @param pathname - The pathname to extract locale from
 * @returns Object with locale, isValid flag, and remaining path
 */
export function extractLocaleFromPath(pathname: string): {
  locale: string;
  validLocale: Locale;
  isValid: boolean;
  remainingPath: string;
} {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  
  if (!localeMatch) {
    return {
      locale: i18n.defaultLocale,
      validLocale: i18n.defaultLocale,
      isValid: true,
      remainingPath: pathname
    };
  }
  
  const [, locale, remainingPath = ''] = localeMatch;
  const isValid = isValidLocale(locale);
  
  return {
    locale,
    validLocale: isValid ? locale : i18n.defaultLocale,
    isValid,
    remainingPath
  };
}

/**
 * Constructs a URL with a valid locale
 * @param pathname - The pathname to construct URL for
 * @param baseUrl - The base URL
 * @param fallbackLocale - Optional fallback locale (defaults to configured default)
 * @returns A URL object with valid locale
 */
export function constructValidLocaleUrl(
  pathname: string, 
  baseUrl: string | URL, 
  fallbackLocale: Locale = i18n.defaultLocale
): URL {
  const { validLocale, remainingPath } = extractLocaleFromPath(pathname);
  
  const finalLocale = isValidLocale(validLocale) ? validLocale : fallbackLocale;
  const newPathname = `/${finalLocale}${remainingPath}`;
  
  return new URL(newPathname, baseUrl);
}