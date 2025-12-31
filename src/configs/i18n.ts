export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'la', 'vi'],
  langDirection: {
    en: 'ltr',
    la: 'ltr',
    vi: 'ltr'
  }
} as const

export type Locale = (typeof i18n)['locales'][number]
