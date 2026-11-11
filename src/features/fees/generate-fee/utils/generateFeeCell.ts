import { normalizeAmountInput } from '@/shared/utils/formatCurrencyAmount'

// Excel serial dates count days since 1899-12-30 (the classic Lotus 1-2-3 leap-year bug epoch).
const EXCEL_EPOCH_OFFSET_DAYS = 25569
const MS_PER_DAY = 86400000

export function excelSerialToIsoDate(serial: number): string | null {
    if (!Number.isFinite(serial)) return null

    const utcMs = Math.round((serial - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY)
    const date = new Date(utcMs)

    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function normalizeDateCell(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
    }

    if (typeof value === 'number') return excelSerialToIsoDate(value)

    const text = String(value).trim()

    if (!text) return null

    const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)

    if (isoMatch) {
        const [, y, m, d] = isoMatch

        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    const dmyMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)

    if (dmyMatch) {
        const [, d, m, y] = dmyMatch

        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }

    const serial = Number(text)

    return text !== '' && Number.isFinite(serial) ? excelSerialToIsoDate(serial) : null
}

export function isValidIsoDate(value: string | null): boolean {
    if (!value) return false
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const date = new Date(`${value}T00:00:00Z`)

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// A stray small number (e.g. "17") in a date column is technically a well-formed Excel serial —
// it converts to a syntactically valid ISO date (~1900), which would otherwise slip past
// isValidIsoDate unnoticed. Real business dates never fall before this floor, so anything earlier
// is treated as a per-row data error instead of a silently-accepted bogus date.
const MIN_PLAUSIBLE_YEAR = 1990

export function isPlausibleBusinessDate(value: string | null): boolean {
    if (!isValidIsoDate(value)) return false

    return Number((value as string).slice(0, 4)) >= MIN_PLAUSIBLE_YEAR
}

export function normalizeNumberCell(value: unknown, locale?: string): number | null {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null

    const text = String(value).trim()

    if (!text) return null

    const normalized = normalizeAmountInput(text, locale)

    if (normalized === '') return null

    const asNumber = Number(normalized)

    return Number.isFinite(asNumber) ? asNumber : null
}

export function normalizeTextCell(value: unknown): string | null {
    if (value === null || value === undefined) return null

    const text = String(value).trim()

    return text ? text : null
}

/** Diacritics/case/whitespace-insensitive form of a header cell, used to match column-name aliases. */
export function normalizeHeaderLabel(value: unknown): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
}
