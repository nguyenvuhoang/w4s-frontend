import type { ChipProps } from '@mui/material'

export type AuditChange = {
    FieldName: string
    OldValue: unknown
    NewValue: unknown
    Delta: unknown
}

type SortableAuditItem = {
    created_on_utc: string | null
}

type AuditRecordLike = SortableAuditItem & {
    action_type: string
    changes: string
}

/**
 * Audit metadata that some change sets also carry as "fields". The card header already shows the
 * actor, time and execution_id, so these are never listed as business changes (for every entity).
 */
export const AUDIT_METADATA_FIELDS = ['UpdatedBy', 'CreatedBy', 'UpdatedOnUtc', 'CreatedOnUtc', 'ExecutionId', 'UserName'] as const

// Field names are compared ignoring case and separators (UpdatedBy / updated_by / UPDATEDBY).
const normalizeFieldName = (fieldName: string) => fieldName.replace(/[\s_-]/g, '').toLowerCase()

/** null, undefined, "" and whitespace-only strings. */
export const isEmptyAuditValue = (value: unknown) => (
    value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
)

// Light normalization only: empty values collapse to one marker, strings are trimmed; no lower-casing and
// no number/date coercion (1 and "1" stay different).
const comparableAuditValue = (value: unknown) => {
    if (isEmptyAuditValue(value)) return 'empty'
    if (typeof value === 'string') return `string:${value.trim()}`

    try {
        return `json:${JSON.stringify(value) ?? String(value)}`
    } catch {
        return `json:${String(value)}`
    }
}

/**
 * A change is worth showing only when the value really changed: EMPTY -> EMPTY and A -> A are noise;
 * EMPTY -> VALUE, VALUE -> EMPTY (a deletion) and A -> B are kept.
 */
export const isMeaningfulAuditChange = (change: Pick<AuditChange, 'OldValue' | 'NewValue'>) => (
    comparableAuditValue(change.OldValue) !== comparableAuditValue(change.NewValue)
)

/** Business changes to display: drops metadata fields, caller-hidden fields and non-changes. */
export const getVisibleAuditChanges = (changes: AuditChange[], hiddenFields: readonly string[] = []) => {
    const excluded = new Set([...AUDIT_METADATA_FIELDS, ...hiddenFields].map(normalizeFieldName))

    return changes.filter(change => !excluded.has(normalizeFieldName(change.FieldName)) && isMeaningfulAuditChange(change))
}

export type AuditDisplayEntry<T> = {
    item: T
    changes: AuditChange[]
    malformed: boolean
}

/**
 * Newest-first entries ready to render. An update whose changes are all noise (or hidden) is dropped
 * instead of rendering an empty card. Create/delete records are kept even without field details (the
 * event itself matters), and unreadable change sets are kept so the problem stays visible.
 */
export const buildAuditDisplayEntries = <T extends AuditRecordLike>(items: T[], hiddenFields: readonly string[] = []): AuditDisplayEntry<T>[] => (
    sortAuditItemsNewestFirst(items)
        .map(item => ({
            item,
            changes: getVisibleAuditChanges(parseAuditChanges(item.changes), hiddenFields),
            malformed: hasMalformedAuditChanges(item.changes)
        }))
        .filter(entry => {
            const action = entry.item.action_type?.trim().toUpperCase()

            return entry.malformed || entry.changes.length > 0 || action === 'I' || action === 'D'
        })
)

const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i

const toUtcDate = (value: string | null | undefined) => {
    const normalized = value?.trim()

    if (!normalized) return null

    const date = new Date(TIMEZONE_SUFFIX_PATTERN.test(normalized) ? normalized : `${normalized}Z`)

    return Number.isNaN(date.getTime()) ? null : date
}

export const parseAuditChanges = (value: string | null | undefined): AuditChange[] => {
    if (!value?.trim()) return []

    try {
        const parsed: unknown = JSON.parse(value)

        if (!Array.isArray(parsed)) return []

        return parsed
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
            .map(item => ({
                FieldName: typeof item.FieldName === 'string' ? item.FieldName : '',
                OldValue: item.OldValue,
                NewValue: item.NewValue,
                Delta: item.Delta
            }))
    } catch {
        return []
    }
}

export const hasMalformedAuditChanges = (value: string | null | undefined) => {
    if (!value?.trim()) return false

    try {
        return !Array.isArray(JSON.parse(value))
    } catch {
        return true
    }
}

export const getAuditActionPresentation = (actionType: string | null | undefined): { label: 'create' | 'update' | 'delete' | 'other'; color: ChipProps['color'] } => {
    switch (actionType?.trim().toUpperCase()) {
        case 'I': return { label: 'create', color: 'success' }
        case 'U': return { label: 'update', color: 'info' }
        case 'D': return { label: 'delete', color: 'error' }
        default: return { label: 'other', color: 'default' }
    }
}

/**
 * Audit timestamps are datetimes: a value without a timezone is UTC and is shown in Vietnam time
 * (dd/MM/yyyy HH:mm, or HH:mm:ss with `withSeconds`).
 */
export const formatAuditDateTime = (value: string | null | undefined, locale: string, options: { withSeconds?: boolean } = {}) => {
    const date = toUtcDate(value)

    if (!date) return '-'

    const parts = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(options.withSeconds ? { second: '2-digit' as const } : {}),
        hour12: false
    }).formatToParts(date)
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''

    const time = `${getPart('hour')}:${getPart('minute')}${options.withSeconds ? `:${getPart('second')}` : ''}`

    return `${getPart('day')}/${getPart('month')}/${getPart('year')} ${time}`
}

export const sortAuditItemsNewestFirst = <T extends SortableAuditItem>(items: T[]) => (
    [...items].sort((a, b) => (toUtcDate(b.created_on_utc)?.getTime() ?? 0) - (toUtcDate(a.created_on_utc)?.getTime() ?? 0))
)

export const getAuditValueText = (value: unknown, emptyText: string) => {
    if (value === null || value === undefined || value === '') return emptyText
    if (typeof value === 'string') return value

    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}
