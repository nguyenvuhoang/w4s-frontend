import type {
    AnnouncementDetailItem,
    AnnouncementDictionary,
    AnnouncementFilterModel,
    AnnouncementLanguage,
    AnnouncementTranslationValue
} from '../types'
import type { ChipProps } from '@mui/material'

export const emptyAnnouncementFilter: AnnouncementFilterModel = {
    page_size: 10,
    page_index: 0,
    search_text: '',
    project_id: 0,
    category: '',
    status: ''
}

export const announcementText = (dictionary: AnnouncementDictionary, key: string, fallback: string) => (
    dictionary.announcement?.[key] ?? dictionary.common?.[key] ?? fallback
)

// Neutral grey selected/hover state for Select/MenuItem dropdowns on the announcement create
// screen. Overrides the app-wide MuiMenuItem theme (src/@core/theme/overrides/menu.ts), which
// paints `.Mui-selected` hover/focus with a green success color; `!important` is required to win
// against that global override without touching it.
export const announcementSelectMenuSx = {
    '& .MuiMenuItem-root.Mui-selected': {
        backgroundColor: 'var(--mui-palette-grey-100) !important',
        color: 'var(--mui-palette-text-primary) !important',
        fontWeight: 500
    },
    '& .MuiMenuItem-root.Mui-selected:hover, & .MuiMenuItem-root.Mui-selected.Mui-focused, & .MuiMenuItem-root.Mui-selected.Mui-focusVisible': {
        backgroundColor: 'var(--mui-palette-grey-200) !important',
        color: 'var(--mui-palette-text-primary) !important'
    },
    '& .MuiMenuItem-root:not(.Mui-selected):hover, & .MuiMenuItem-root:not(.Mui-selected).Mui-focusVisible': {
        backgroundColor: 'var(--mui-palette-grey-50) !important'
    }
} as const

export const commonText = (dictionary: AnnouncementDictionary, key: string, fallback: string) => (
    dictionary.common?.[key] ?? fallback
)

export const formatAnnouncementDate = (value: string, locale: string) => {
    if (!value) return '-'

    const date = new Date(value.endsWith('Z') ? value : `${value}Z`)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(date)
}

// Full date + time in the viewer's local timezone (e.g. "11/07/2026 21:37"), unlike
// formatAnnouncementDate above which only shows the date for list/table display.
export const formatAnnouncementDateTime = (value: string, locale: string) => {
    if (!value) return '-'

    const date = new Date(value.endsWith('Z') ? value : `${value}Z`)

    if (Number.isNaN(date.getTime())) return '-'

    const dpad = (part: number) => String(part).padStart(2, '0')
    const day = dpad(date.getDate())
    const month = dpad(date.getMonth() + 1)
    const year = date.getFullYear()
    const hours = dpad(date.getHours())
    const minutes = dpad(date.getMinutes())

    return locale === 'vi' ? `${day}/${month}/${year} ${hours}:${minutes}` : `${month}/${day}/${year} ${hours}:${minutes}`
}

export const getAnnouncementCategoryColor = (
  category?: string | null
): ChipProps['color'] => {
  switch (category?.trim().toUpperCase()) {
    case 'EMERGENCY':
      return 'error'

    case 'MAINTENANCE':
      return 'warning'

    case 'EVENT':
      return 'success'

    case 'NOTICE':
    case 'GENERAL':
      return 'info'

    default:
      return 'default'
  }
}
export const getAnnouncementCategoryLabel = (
    category: string,
    locale: string,
    dictionary?: AnnouncementDictionary
) => {
    const normalizedCategory = category?.trim().toUpperCase()
    const normalizedLocale = locale?.toLowerCase().startsWith('vi') ? 'vi' : 'en'

    const dictionaryKeys: Record<string, string> = {
        OPERATION: 'category_operation',
        NEWS: 'category_news',
        EVENT: 'category_event',
        MAINTENANCE: 'category_maintenance',
        OTHER: 'category_other',
        REGULATION: 'category_regulation',
        FORM: 'category_form',
        GUIDE: 'category_guide',
        ANNOUNCEMENT: 'category_announcement',
        PROMOTION: 'category_promotion'
    }

    const dictionaryKey = dictionaryKeys[normalizedCategory]

    if (dictionary && dictionaryKey) {
        const translatedLabel = announcementText(dictionary, dictionaryKey, '')

        if (translatedLabel) return translatedLabel
    }

    const labels: Record<string, Record<string, string>> = {
        vi: {
            OPERATION: 'Hoạt động',
            NEWS: 'Tin tức',
            EVENT: 'Sự kiện',
            MAINTENANCE: 'Bảo trì',
            OTHER: 'Khác',
            REGULATION: 'Quy định',
            FORM: 'Biểu mẫu',
            GUIDE: 'Hướng dẫn',
            ANNOUNCEMENT: 'Thông báo',
            PROMOTION: 'Ưu đãi'
        },
        en: {
            OPERATION: 'Operation',
            NEWS: 'News',
            EVENT: 'Event',
            MAINTENANCE: 'Maintenance',
            OTHER: 'Other',
            REGULATION: 'Regulation',
            FORM: 'Form',
            GUIDE: 'Guide',
            ANNOUNCEMENT: 'Announcement',
            PROMOTION: 'Promotion'
        }
    }

    return labels[normalizedLocale][normalizedCategory] ?? category ?? '-'
}

export const getAnnouncementStatusLabel = (status: string, locale: string, dictionary?: AnnouncementDictionary) => {
    const dictionaryLabels: Record<string, string | undefined> = {
        A: dictionary ? announcementText(dictionary, 'status_active', '') : undefined,
        I: dictionary ? announcementText(dictionary, 'status_inactive', '') : undefined,
        B: dictionary ? announcementText(dictionary, 'status_blocked', '') : undefined,
        DRAFT: dictionary ? announcementText(dictionary, 'status_draft', '') : undefined,
        R: dictionary ? announcementText(dictionary, 'status_released', '') : undefined
    }

    if (dictionaryLabels[status]) return dictionaryLabels[status]

    const viLabels: Record<string, string> = {
        A: 'Đang hoạt động',
        I: 'Ngưng hoạt động',
        B: 'Bị khóa',
        DRAFT: 'Nháp',
        R: 'Đã phát hành'
    }
    const enLabels: Record<string, string> = {
        A: 'Active',
        I: 'Inactive',
        B: 'Blocked',
        DRAFT: 'Draft',
        R: 'Released'
    }

    return (locale === 'vi' ? viLabels : enLabels)[status] ?? status ?? '-'
}

export const getAnnouncementStatusColor = (status: string) => {
    if (status === 'A') return 'success'
    if (status === 'I') return 'default'
    if (status === 'B') return 'error'
    if (status === 'DRAFT') return 'warning'
    if (status === 'R') return 'success'

    return 'info'
}

export const getBooleanLabel = (value: boolean, locale: string, dictionary?: AnnouncementDictionary) => {
    if (dictionary) return announcementText(dictionary, value ? 'boolean_yes' : 'boolean_no', value ? 'Yes' : 'No')

    return locale === 'vi' ? (value ? 'Có' : 'Không') : (value ? 'Yes' : 'No')
}

export const formatFileSize = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) return '-'

    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`

    return `${(size / 1024).toFixed(0)} KB`
}

export const getAnnouncementLanguage = (locale: string): AnnouncementLanguage => (
    locale === 'en' ? 'en' : 'vi'
)

export const getLocalizedAnnouncementDetail = (
    announcement: AnnouncementDetailItem,
    locale: string
): AnnouncementTranslationValue => {
    const language = getAnnouncementLanguage(locale)
    const translation = announcement.translations?.[language]

    return {
        title: translation?.title || announcement.title,
        summary: translation?.summary || announcement.summary,
        content: translation?.content || announcement.content
    }
}
