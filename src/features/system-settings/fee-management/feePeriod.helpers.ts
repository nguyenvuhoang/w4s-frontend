import type { FeePeriodFilterModel } from '@/features/fees/types'
import { formatDate } from '@/shared/utils/formatDate'

import { FEE_SETTINGS_BASE_PATH } from './feeSettingsModules'

export const FEE_PERIOD_MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

const pad2 = (value: number) => String(value).padStart(2, '0')

/** `/{locale}/system-settings/fee-management/fee-periods{suffix}` */
export const feePeriodsHref = (locale: string, suffix = '') => `/${locale}${FEE_SETTINGS_BASE_PATH}/fee-periods${suffix}`

/**
 * due_date is a calendar date stored as a UTC timestamp (Create sample: 2026-06-14T00:00:00Z).
 * It is read and written in UTC so the date never shifts with the browser timezone
 * (2026-08-31T23:59:59Z stays 31/08/2026).
 */
const UTC_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

/** ISO timestamp → yyyy-MM-dd (UTC calendar date) for the native date input. */
export const toFeePeriodDueDateInput = (value: string | null | undefined) => {
  if (!value) return ''

  const match = UTC_DATE_PATTERN.exec(value)

  if (match && !value.includes('T')) return `${match[1]}-${match[2]}-${match[3]}`

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

/** yyyy-MM-dd from the date input → UTC midnight timestamp, the format of the Create request. */
export const toFeePeriodDueDatePayload = (value: string) => `${value}T00:00:00Z`

/** dd/MM/yyyy of the UTC calendar date. */
export const formatFeePeriodDueDate = (value: string | null | undefined) => {
  const input = toFeePeriodDueDateInput(value)

  if (!input) return value ? value : '-'

  const [year, month, day] = input.split('-').map(Number)

  return formatDate(new Date(year, month - 1, day))
}

export const formatFeePeriodMonth = (year: number | null, month: number | null) => (
  year && month ? `${pad2(month)}/${year}` : '-'
)

export const getFeePeriodStatusColor = (status: string) => {
  if (status === 'OPEN') return 'success' as const
  if (status === 'LOCKED') return 'warning' as const

  return 'default' as const
}

/**
 * Tokens: {month} (8), {MM} (08), {year} (2026).
 * VI `Kỳ phí tháng {month} năm {year}` → `Kỳ phí tháng 8 năm 2026`; EN `Fee period for {MM}/{year}` → `Fee period for 08/2026`.
 */
export const buildFeePeriodName = (pattern: string, year: number | null, month: number | null) => (
  year && month
    ? pattern.replaceAll('{MM}', pad2(month)).replaceAll('{month}', String(month)).replaceAll('{year}', String(year))
    : '-'
)

export const FEE_PERIOD_DEFAULT_PAGE_SIZE = 10

/** Default list filter: all projects, years, months and statuses. */
export const emptyFeePeriodFilter: FeePeriodFilterModel = {
  search_text: '',
  project_id: null,
  year: null,
  month: null,
  status: '',
  page_index: 1,
  page_size: FEE_PERIOD_DEFAULT_PAGE_SIZE
}

export const FEE_PERIOD_FILTER_FIRST_YEAR = 2020

/** Year options built on the client: 2020 … current year + 5 (list filter, form and quick create). */
export const getFeePeriodFilterYearOptions = (currentYear = new Date().getFullYear()) => (
  Array.from({ length: currentYear + 5 - FEE_PERIOD_FILTER_FIRST_YEAR + 1 }, (_, index) => FEE_PERIOD_FILTER_FIRST_YEAR + index)
)

/** Backend error code of WF_BO_GET_FEE_PERIOD_BY_ID for an unknown id. */
export const FEE_PERIOD_NOT_FOUND_ERROR_CODE = 'ips.feeperiod.id.notfound'
