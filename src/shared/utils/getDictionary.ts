// Third-party Imports
import 'server-only'

// Type Imports
import type { Locale } from '@configs/i18n'

const dictionaries: Record<Locale, () => Promise<any>> = {
  en: () => import('@/data/dictionaries/en.json').then(m => m.default),
  vi: () => import('@/data/dictionaries/vi.json').then(m => m.default),
  la: () => import('@/data/dictionaries/la.json').then(m => m.default)
}

export const getDictionary = async (locale: Locale) => {
  const loader = dictionaries[locale] ?? dictionaries['en'] // fallback to English
  return loader()
}
