import { formatDateShort } from '@/shared/utils/formatDateShort'
import type { ChipProps } from '@mui/material/Chip'

import type { PromotionDictionary, PromotionFilterModel, PromotionStatus } from '../types'

/**
 * 0 means "no working project resolved yet" — never a real project id. The initial SSR fetch may
 * run with this sentinel before the client-side working-project context (RequireWorkingProject /
 * useWorkingProject) resolves and reloads the list with the real project_id.
 */
export const emptyPromotionFilter: PromotionFilterModel = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  project_id: 0
}

export const promotionText = (dictionary: PromotionDictionary, key: string, fallback: string) => (
  (dictionary as any).promotionManagement?.[key] ?? fallback
)

export const commonText = (dictionary: PromotionDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayPromotionText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const formatPromotionDate = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return formatDateShort(value)
}

/**
 * Converts a backend date/datetime into the YYYY-MM-DD value used by the date inputs (the same
 * format the create workflow sends). The date part is taken as-is to avoid timezone day shifts.
 */
export const toPromotionDateInput = (value?: string | null) => {
  if (!value) return ''

  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())

  if (match) return match[1]

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const pad = (part: number) => String(part).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** The promotion id lives in the path; project_id stays in the query string. */
export const getPromotionListHref = (locale: string, projectId?: number | null) => (
  projectId ? `/${locale}/promotion-management?project_id=${projectId}` : `/${locale}/promotion-management`
)

export const getPromotionDetailHref = (locale: string, id: number | string, projectId?: number | null) => (
  `/${locale}/promotion-management/${encodeURIComponent(String(id))}${projectId ? `?project_id=${projectId}` : ''}`
)

export const getPromotionEditHref = (locale: string, id: number | string, projectId?: number | null) => (
  `/${locale}/promotion-management/${encodeURIComponent(String(id))}/edit${projectId ? `?project_id=${projectId}` : ''}`
)

export const getPromotionWebViewLabel = (dictionary: PromotionDictionary, value: boolean | null) => {
  if (value === null) return '-'

  return value ? promotionText(dictionary, 'boolean_yes', 'Yes') : promotionText(dictionary, 'boolean_no', 'No')
}

export const formatPromotionValidPeriod = (from?: string | null, to?: string | null) => {
  const fromText = formatPromotionDate(from)
  const toText = formatPromotionDate(to)

  if (fromText === '-' && toText === '-') return '-'
  if (fromText !== '-' && toText !== '-') return `${fromText} → ${toText}`

  return fromText !== '-' ? fromText : toText
}

export const getPromotionStatusColor = (status: PromotionStatus): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}

export const getPromotionStatusLabel = (dictionary: PromotionDictionary, status: PromotionStatus) => {
  if (status === 'A') return promotionText(dictionary, 'status_active', 'Active')
  if (status === 'I') return promotionText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return promotionText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'DRAFT') return promotionText(dictionary, 'status_draft', 'Draft')

  return status || '-'
}

export type PromotionLifecycleStatus = 'upcoming' | 'ongoing' | 'expired' | 'unknown'

/**
 * Derived, display-only lifecycle state based on valid_from/valid_to vs. now. This never replaces
 * or is sent back as the backend `status` field — it only helps admins scan which promotions are
 * currently effective.
 */
export const getPromotionLifecycleStatus = (
  validFrom?: string | null,
  validTo?: string | null,
  now: Date = new Date()
): PromotionLifecycleStatus => {
  const fromDate = validFrom ? new Date(validFrom) : null
  const toDate = validTo ? new Date(validTo) : null
  const fromValid = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null
  const toValid = toDate && !Number.isNaN(toDate.getTime()) ? toDate : null

  if (!fromValid && !toValid) return 'unknown'
  if (fromValid && now < fromValid) return 'upcoming'
  if (toValid && now > toValid) return 'expired'

  return 'ongoing'
}

export const getPromotionLifecycleColor = (lifecycle: PromotionLifecycleStatus): ChipProps['color'] => {
  if (lifecycle === 'upcoming') return 'info'
  if (lifecycle === 'ongoing') return 'success'
  if (lifecycle === 'expired') return 'default'

  return 'default'
}

export const getPromotionLifecycleLabel = (dictionary: PromotionDictionary, lifecycle: PromotionLifecycleStatus) => {
  if (lifecycle === 'upcoming') return promotionText(dictionary, 'lifecycle_upcoming', 'Upcoming')
  if (lifecycle === 'ongoing') return promotionText(dictionary, 'lifecycle_ongoing', 'Ongoing')
  if (lifecycle === 'expired') return promotionText(dictionary, 'lifecycle_expired', 'Expired')

  return ''
}
