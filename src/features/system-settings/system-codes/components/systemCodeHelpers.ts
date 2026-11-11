import type { Locale } from '@/configs/i18n'

import type { SystemCodeFilterModel, SystemCodesDictionary } from '../types'

export const emptySystemCodeFilter: SystemCodeFilterModel = {
  search_text: '',
  page_index: 0,
  page_size: 10
}

export const systemCodeText = (dictionary: SystemCodesDictionary, key: string, fallback: string) => (
  dictionary.system_codes?.[key] ?? fallback
)

export const commonText = (dictionary: SystemCodesDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

type CaptionMap = Partial<Record<Locale | 'lo' | 'zh', string>>

const isCaptionMap = (value: unknown): value is CaptionMap => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

export const resolveLocalizedCaption = ({
  locale,
  mCaption,
  caption,
  codeId
}: {
  locale: Locale
  mCaption: string
  caption: string
  codeId: string
}) => {
  if (mCaption.trim()) {
    try {
      const parsed = JSON.parse(mCaption) as unknown

      if (isCaptionMap(parsed)) {
        const localizedValue = parsed[locale]

        if (typeof localizedValue === 'string' && localizedValue.trim()) return localizedValue.trim()
      }
    } catch {
      // Invalid multilingual caption should not break the list view.
    }
  }

  return caption.trim() || codeId.trim() || '-'
}

export const formatSystemCodeNumber = (value: number | null, locale: Locale) => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
}
