import { formatDateShort } from '@/shared/utils/formatDateShort'
import type { ChipProps } from '@mui/material/Chip'

import type { BannerDictionary, BannerFilterModel, BannerStatus } from '../types'

export const defaultBannerProjectId = 1

export const emptyBannerFilter: BannerFilterModel = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  project_id: defaultBannerProjectId
}

export const bannerText = (dictionary: BannerDictionary, key: string, fallback: string) => (
  dictionary.bannerList?.[key] ?? fallback
)

export const commonText = (dictionary: BannerDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayBannerText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const formatBannerDate = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return formatDateShort(value)
}

export const formatBannerEffectiveTime = (from?: string | null, to?: string | null) => {
  const fromText = formatBannerDate(from)
  const toText = formatBannerDate(to)

  if (fromText === '-' && toText === '-') return '-'
  if (fromText !== '-' && toText !== '-') return `${fromText} - ${toText}`

  return fromText !== '-' ? fromText : toText
}

export const getBannerStatusColor = (status: BannerStatus): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}

export const getBannerStatusLabel = (dictionary: BannerDictionary, status: BannerStatus) => {
  if (status === 'A') return bannerText(dictionary, 'status_active', 'Active')
  if (status === 'I') return bannerText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return bannerText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'DRAFT') return bannerText(dictionary, 'status_draft', 'Draft')

  return status || '-'
}

const normalizeLabelKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

export const getBannerTypeLabel = (dictionary: BannerDictionary, value: string) => {
  if (!value) return '-'

  return bannerText(dictionary, `banner_type_${normalizeLabelKey(value)}`, value)
}

export const getBannerActionTypeLabel = (dictionary: BannerDictionary, value: string) => {
  if (!value) return '-'

  return bannerText(dictionary, `action_type_${normalizeLabelKey(value)}`, value)
}

export const formatBannerProject = (banner: { project_code?: string | null; project_name?: string | null; project_id?: number | null }) => {
  if (banner.project_code && banner.project_name) return `[${banner.project_code}] ${banner.project_name}`
  if (banner.project_code) return banner.project_code
  if (banner.project_name) return banner.project_name
  if (banner.project_id) return String(banner.project_id)

  return '-'
}
