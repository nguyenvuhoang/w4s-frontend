import { i18n } from '@/configs/i18n'

export const normalizeLang = (lang?: string) =>
  (lang ?? i18n.defaultLocale).toLowerCase().split('-')[0] // 'vi-VN' -> 'vi'
