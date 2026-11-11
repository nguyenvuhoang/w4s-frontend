import { formatAuditDateTime } from '@/shared/utils/entityAuditHelpers'

// `handover_date` is a date-only business field, handled as a plain YYYY-MM-DD string (date input value ->
// workflow). WF_BO_GET_PROJECT_DETAIL may however return it as a UTC instant of the Vietnam midnight
// ("2026-09-28T17:00:00Z" = 29/09/2026 00:00 +07): such values are converted to the Vietnam calendar day
// with the application's standard UTC -> Asia/Ho_Chi_Minh formatter, so the day is not shifted back.

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/
// A date-time carrying an explicit timezone (Z or ±hh:mm) is an instant, not a calendar date.
const INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T[^\s]*(Z|[+-]\d{2}:?\d{2})$/i
const DISPLAY_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})/

/** Backend value -> calendar date YYYY-MM-DD (Vietnam day for an instant), '' when missing/invalid. */
const toHandoverCalendarDate = (value?: string | null) => {
  const trimmed = value?.trim() ?? ''

  if (INSTANT_PATTERN.test(trimmed)) {
    const vietnamDate = DISPLAY_DATE_PATTERN.exec(formatAuditDateTime(trimmed, 'vi'))

    return vietnamDate ? `${vietnamDate[3]}-${vietnamDate[2]}-${vietnamDate[1]}` : ''
  }

  const match = DATE_ONLY_PATTERN.exec(trimmed)

  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

/** Backend value -> date input value (YYYY-MM-DD) or ''. */
export const toHandoverDateInput = (value?: string | null) => toHandoverCalendarDate(value)

/** Date input value -> workflow value: YYYY-MM-DD, or null when no date is chosen (never today's date). */
export const toHandoverDatePayload = (value: string) => toHandoverDateInput(value) || null

/** Display as DD/MM/YYYY, "--" when empty. */
export const formatHandoverDate = (value?: string | null) => {
  const date = toHandoverCalendarDate(value)

  return date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : '--'
}
