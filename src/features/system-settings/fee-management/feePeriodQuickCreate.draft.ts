import type { FeePeriodBatchSaveItem, FeePeriodPreviewItem } from '@/features/fees/types'

export type FeePeriodDraftField = 'period_name' | 'from_date' | 'to_date' | 'due_date' | 'description'

/**
 * Editable copy of one preview period. Dates are kept as yyyy-MM-dd (UTC calendar date) whatever the display
 * format (the DatePicker shows dd/MM/yyyy), '' when empty, or FEE_PERIOD_DRAFT_INVALID_DATE for an incomplete entry.
 */
export type FeePeriodDraftRow = {
  key: string
  period_code: string
  project_id: number | null
  project_code: string | null
  project_name: string | null
  year: number | null
  month: number | null
  status: string
  period_name: string
  from_date: string
  to_date: string
  due_date: string
  description: string
  source: FeePeriodPreviewItem
}

export type FeePeriodDraftErrorField = Exclude<FeePeriodDraftField, 'description'> | 'identity'

/** Values are i18n keys of fee_settings. */
export type FeePeriodDraftErrors = Record<string, Partial<Record<FeePeriodDraftErrorField, string>>>

/** Draft value of a date typed by keyboard that is not (yet) a real date; rejected by isValidDateInput. */
export const FEE_PERIOD_DRAFT_INVALID_DATE = 'invalid'

const DATE_INPUT_PATTERN =/^(\d{4})-(\d{2})-(\d{2})$/
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i

const pad2 = (value: number) => String(value).padStart(2, '0')

type TimestampParts = { date: string; time: string }

/**
 * Splits a backend timestamp into its UTC calendar date and time without using the browser timezone:
 * a value without offset (or with Z) is taken literally, a value with another offset is converted to UTC.
 */
const parseTimestamp = (value: string | null | undefined): TimestampParts | null => {
  if (!value) return null

  const match = TIMESTAMP_PATTERN.exec(value.trim())

  if (!match) return null

  const [, year, month, day, hour = '00', minute = '00', second = '00', offset] = match

  if (!offset || offset.toUpperCase() === 'Z') {
    return isValidDateInput(`${year}-${month}-${day}`) ? { date: `${year}-${month}-${day}`, time: `${hour}:${minute}:${second}` } : null
  }

  const date = new Date(value.trim())

  if (Number.isNaN(date.getTime())) return null

  return {
    date: `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`,
    time: `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${pad2(date.getUTCSeconds())}`
  }
}

/** True for a real calendar date in yyyy-MM-dd (2026-02-30 is rejected). */
export const isValidDateInput = (value: string) => {
  const match = DATE_INPUT_PATTERN.exec(value)

  if (!match) return false

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Backend timestamp → yyyy-MM-dd of its UTC calendar date ('' when missing or unreadable). */
export const toDraftDateInput = (value: string | null | undefined) => parseTimestamp(value)?.date ?? ''

const DEFAULT_TIME: Record<'from_date' | 'to_date' | 'due_date', string> = {
  from_date: '00:00:00',
  to_date: '23:59:59',
  due_date: '23:59:59'
}

/**
 * yyyy-MM-dd → UTC timestamp for the Batch Save payload. An unchanged date keeps the backend value as is;
 * a changed date keeps the backend time of day (e.g. 23:59:59 for to_date / due_date). No toISOString().
 */
export const toDraftDatePayload = (
  input: string,
  original: string | null | undefined,
  field: 'from_date' | 'to_date' | 'due_date'
) => {
  if (!isValidDateInput(input)) return ''

  const parsed = parseTimestamp(original)

  if (parsed && parsed.date === input && original && /Z$/i.test(original.trim())) return original.trim()

  return `${input}T${parsed?.time ?? DEFAULT_TIME[field]}Z`
}

export const createFeePeriodDrafts = (periods: FeePeriodPreviewItem[]): FeePeriodDraftRow[] => (
  periods.map((period, index) => ({
    key: String(index),
    period_code: period.period_code,
    project_id: period.project_id,
    project_code: period.project_code,
    project_name: period.project_name,
    year: period.year,
    month: period.month,
    status: period.status,
    period_name: period.period_name,
    from_date: toDraftDateInput(period.from_date),
    to_date: toDraftDateInput(period.to_date),
    due_date: toDraftDateInput(period.due_date),
    description: period.description ?? '',
    source: period
  }))
)

/** Immutable update of one field of one row; the other rows keep their identity. */
export const updateFeePeriodDraft = (
  rows: FeePeriodDraftRow[],
  key: string,
  field: FeePeriodDraftField,
  value: string
) => rows.map(row => (row.key === key ? { ...row, [field]: value } : row))

const isRowDirty = (row: FeePeriodDraftRow) => (
  row.period_name !== row.source.period_name
  || row.from_date !== toDraftDateInput(row.source.from_date)
  || row.to_date !== toDraftDateInput(row.source.to_date)
  || row.due_date !== toDraftDateInput(row.source.due_date)
  || row.description !== (row.source.description ?? '')
)

export const isFeePeriodDraftsDirty = (rows: FeePeriodDraftRow[] | null) => Boolean(rows?.some(isRowDirty))

const dateError = (value: string, field: 'from_date' | 'to_date' | 'due_date') => {
  if (!value) return `quick_create_error_${field}_required`
  if (!isValidDateInput(value)) return `quick_create_error_${field}_invalid`

  return undefined
}

/** Row/field errors before Batch Save; an empty object means the rows can be saved. */
export const validateFeePeriodDrafts = (rows: FeePeriodDraftRow[]): FeePeriodDraftErrors => {
  const errors: FeePeriodDraftErrors = {}
  const identityCount = new Map<string, number>()
  const codeCount = new Map<string, number>()
  const identityKey = (row: FeePeriodDraftRow) => `${row.project_id}|${row.year}|${row.month}`
  const codeKey = (row: FeePeriodDraftRow) => row.period_code.trim().toUpperCase()

  rows.forEach(row => {
    identityCount.set(identityKey(row), (identityCount.get(identityKey(row)) ?? 0) + 1)
    if (codeKey(row)) codeCount.set(codeKey(row), (codeCount.get(codeKey(row)) ?? 0) + 1)
  })

  rows.forEach(row => {
    const rowErrors: FeePeriodDraftErrors[string] = {}

    if (!row.period_name.trim()) rowErrors.period_name = 'quick_create_error_period_name_required'

    const fromError = dateError(row.from_date, 'from_date')
    const toError = dateError(row.to_date, 'to_date')
    const dueError = dateError(row.due_date, 'due_date')

    if (fromError) rowErrors.from_date = fromError
    if (toError) rowErrors.to_date = toError
    if (dueError) rowErrors.due_date = dueError

    // The start date must stay in the month the period was generated for (month of the preview from_date,
    // or the period year/month when the preview had none).
    const periodMonth = toDraftDateInput(row.source.from_date).slice(0, 7)
      || (row.year && row.month ? `${row.year}-${String(row.month).padStart(2, '0')}` : '')

    if (!fromError && periodMonth && row.from_date.slice(0, 7) !== periodMonth) {
      rowErrors.from_date = 'quick_create_error_from_date_out_of_period'
    }

    if (!fromError && !toError && !rowErrors.from_date) {
      const from = Date.parse(toDraftDatePayload(row.from_date, row.source.from_date, 'from_date'))
      const to = Date.parse(toDraftDatePayload(row.to_date, row.source.to_date, 'to_date'))

      if (from > to) rowErrors.from_date = 'quick_create_error_from_after_to'
    }

    if (!row.project_id || !row.year || !row.month || !row.period_code.trim()) {
      rowErrors.identity = 'quick_create_error_identity_missing'
    } else if ((identityCount.get(identityKey(row)) ?? 0) > 1 || (codeCount.get(codeKey(row)) ?? 0) > 1) {
      rowErrors.identity = 'quick_create_error_duplicate'
    }

    if (Object.keys(rowErrors).length > 0) errors[row.key] = rowErrors
  })

  return errors
}

/** Batch Save items: identity fields and status from the preview, edited values from the draft. */
export const buildFeePeriodBatchSaveItems = (rows: FeePeriodDraftRow[]): FeePeriodBatchSaveItem[] => (
  rows.map(row => ({
    period_code: row.period_code,
    period_name: row.period_name.trim(),
    project_id: Number(row.project_id),
    year: Number(row.year),
    month: Number(row.month),
    from_date: toDraftDatePayload(row.from_date, row.source.from_date, 'from_date'),
    to_date: toDraftDatePayload(row.to_date, row.source.to_date, 'to_date'),
    due_date: toDraftDatePayload(row.due_date, row.source.due_date, 'due_date'),
    status: row.status,
    description: row.description.trim()
  }))
)

export type FeePeriodDraftGroup = {
  projectId: number | null
  label: string
  rows: FeePeriodDraftRow[]
}

/** Groups rows by project (backend order kept) so periods of different projects are never mixed. */
export const groupFeePeriodDrafts = (rows: FeePeriodDraftRow[]): FeePeriodDraftGroup[] => {
  const groups = new Map<string, FeePeriodDraftGroup>()

  rows.forEach(row => {
    const groupKey = String(row.project_id ?? '')
    const label = row.project_code && row.project_name
      ? `[${row.project_code}] ${row.project_name}`
      : row.project_name ?? row.project_code ?? (row.project_id ? `#${row.project_id}` : '-')
    const group = groups.get(groupKey)

    if (group) group.rows.push(row)
    else groups.set(groupKey, { projectId: row.project_id, label, rows: [row] })
  })

  return Array.from(groups.values())
}
