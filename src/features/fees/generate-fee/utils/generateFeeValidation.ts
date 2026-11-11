import type {
    GenerateFeeImportRow,
    GenerateFeeRequestItem
} from '../types'
import {
    isPlausibleBusinessDate,
    normalizeDateCell,
    normalizeHeaderLabel,
    normalizeNumberCell,
    normalizeTextCell
} from './generateFeeCell'

export type GenerateFeeMessages = {
    validationCustomerNameRequired: string
    validationApartmentRequired: string
    validationBillNumberRequired: string
    validationDescriptionRequired: string
    validationDebitAmountRequired: string
    validationInvalidDate: string
    validationAmountInvalid: string
    validationAmountNegative: string
    fieldPostingDate: string
    fieldDocumentDate: string
    fieldInvoiceDate: string
    fieldTotalAmount: string
    fieldCollectedAmount: string
    fieldDebitAmount: string
}

/**
 * Fixed column order used only as a positional fallback when a header cell's text does not match
 * any known alias (e.g. blank/unexpected header) — see resolveGenerateFeeColumnIndexes. It matches
 * the current 12-column customer template column-for-column; the legacy 9-column Data Import
 * template is still recognized correctly because every field is matched by name first.
 */
export const GENERATE_FEE_FIELD_KEYS = [
    'customer_name',
    'apartment_code',
    'posting_date',
    'document_date',
    'bill_number',
    'invoice_date',
    'invoice_number',
    'description',
    'opening_remaining_amount',
    'total_amount',
    'collected_amount',
    'debit_amount'
] as const

export type GenerateFeeFieldKey = typeof GENERATE_FEE_FIELD_KEYS[number]

// Diacritics/case/whitespace-insensitive header text -> field. "apartment_code" accepts both the
// current "Mã khách hàng" and the legacy "Mã căn hộ" label so old template files keep working.
const FIELD_HEADER_ALIASES: Record<GenerateFeeFieldKey, string[]> = {
    customer_name: ['tenkhachhang'],
    apartment_code: ['makhachhang', 'macanho'],
    posting_date: ['ngayhachtoan'],
    document_date: ['ngaychungtu'],
    bill_number: ['sochungtu'],
    invoice_date: ['ngayhoadon'],
    invoice_number: ['sohoadon'],
    description: ['diengiai'],
    opening_remaining_amount: ['soconphaithudk'],
    total_amount: ['giatrihoadon'],
    collected_amount: ['sodathu'],
    debit_amount: ['soconphaithu']
}

export type GenerateFeeColumnIndexes = Record<GenerateFeeFieldKey, number>

/**
 * Maps each business field to a source column index by matching the header row's text against
 * known aliases (name-based), falling back to the fixed positional order for any field whose
 * header text isn't recognized — so reordered/renamed-but-equivalent templates still parse
 * correctly instead of silently reading the wrong column.
 */
export function resolveGenerateFeeColumnIndexes(headerRow: unknown[] | null | undefined): GenerateFeeColumnIndexes {
    const normalizedHeader = (headerRow ?? []).map(normalizeHeaderLabel)
    const indexes = {} as GenerateFeeColumnIndexes

    GENERATE_FEE_FIELD_KEYS.forEach((field, positionalIndex) => {
        const matchedIndex = normalizedHeader.findIndex(text => FIELD_HEADER_ALIASES[field].includes(text))

        indexes[field] = matchedIndex >= 0 ? matchedIndex : positionalIndex
    })

    return indexes
}

/** How many known field aliases a row's cells match — used to decide whether a pasted first line is a header row. */
export function countHeaderAliasMatches(row: unknown[]): number {
    const normalizedCells = row.map(normalizeHeaderLabel)

    return GENERATE_FEE_FIELD_KEYS.filter(field => FIELD_HEADER_ALIASES[field].some(alias => normalizedCells.includes(alias))).length
}

const TOTAL_ROW_MARKER = 'tongcong'

/** Detects a trailing "Tổng cộng" summary line so it never gets parsed as a data row. */
export function isTotalSummaryRow(cells: unknown[]): boolean {
    return cells.some(cell => normalizeHeaderLabel(cell).includes(TOTAL_ROW_MARKER))
}

export function createEmptyGenerateFeeRow(rowNumber: number): GenerateFeeImportRow {
    return {
        row_number: rowNumber,
        status: 'VALID',
        customer_name: null,
        apartment_code: null,
        posting_date: null,
        document_date: null,
        bill_payment_number: null,
        invoice_date: null,
        invoice_number: null,
        description: null,
        opening_remaining_amount: null,
        amount: null,
        paid_amount: null,
        remaining_amount: null,
        fee_type_code: null,
        fee_type_name: null,
        fee_invoice_id: null,
        errors: [],
        warnings: []
    }
}

const extractFeeTypePrefix = (billNumber: string | null): string | null => {
    if (!billNumber || !billNumber.includes('/')) return null

    const prefix = billNumber.split('/')[0]?.trim()

    return prefix ? prefix.toUpperCase() : null
}

export function buildGenerateFeeRow(
    rowNumber: number,
    cells: unknown[],
    locale: string | undefined,
    columnIndexes: GenerateFeeColumnIndexes
): GenerateFeeImportRow {
    const row = createEmptyGenerateFeeRow(rowNumber)

    row.customer_name = normalizeTextCell(cells[columnIndexes.customer_name])
    row.apartment_code = normalizeTextCell(cells[columnIndexes.apartment_code])?.toUpperCase() ?? null
    row.posting_date = normalizeDateCell(cells[columnIndexes.posting_date])
    row.document_date = normalizeDateCell(cells[columnIndexes.document_date])
    row.bill_payment_number = normalizeTextCell(cells[columnIndexes.bill_number])
    row.invoice_date = normalizeDateCell(cells[columnIndexes.invoice_date])
    row.invoice_number = normalizeTextCell(cells[columnIndexes.invoice_number])
    row.description = normalizeTextCell(cells[columnIndexes.description])
    // Older 9-column files have no "Số còn phải thu ĐK" column at all — the resolved index then
    // falls outside that row's cells and normalizeNumberCell(undefined) already yields null, so no
    // special-casing is needed to permit null here.
    row.opening_remaining_amount = normalizeNumberCell(cells[columnIndexes.opening_remaining_amount], locale)
    row.amount = normalizeNumberCell(cells[columnIndexes.total_amount], locale)

    // "Số đã thu" is genuinely blank on many rows in the customer file — that must default to 0,
    // not fail validation. Only a non-blank cell that still fails to parse is a real data error.
    const collectedText = normalizeTextCell(cells[columnIndexes.collected_amount])

    row.paid_amount = collectedText === null ? 0 : normalizeNumberCell(cells[columnIndexes.collected_amount], locale)

    row.remaining_amount = normalizeNumberCell(cells[columnIndexes.debit_amount], locale)
    row.fee_type_code = extractFeeTypePrefix(row.bill_payment_number)

    return row
}

export function isBlankRowCells(cells: unknown[]): boolean {
    return cells.every(cell => cell === null || cell === undefined || String(cell).trim() === '')
}

const recomputeRowStatus = (row: GenerateFeeImportRow): void => {
    row.status = row.errors.length > 0 ? 'INVALID' : row.warnings.length > 0 ? 'WARNING' : 'VALID'
}

/**
 * Client-side checks are intentionally basic (required fields + data type/plausibility) — the
 * final status/errors for an uploaded file come from the backend validation response instead
 * (see generateFeeBackendMapper.ts). This function is only the source of truth for pasted-table
 * rows, which have no backend validation call. Per the current template, "remaining_amount" is no
 * longer cross-checked against "amount - paid_amount": the file now carries an opening balance
 * ("Số còn phải thu ĐK") and historical debt rows for which that formula does not hold.
 */
export function validateGenerateFeeRow(row: GenerateFeeImportRow, messages: GenerateFeeMessages): void {
    const errors: string[] = []
    const warnings: string[] = []

    if (!row.customer_name) errors.push(messages.validationCustomerNameRequired)
    if (!row.apartment_code) errors.push(messages.validationApartmentRequired)
    if (!row.bill_payment_number) errors.push(messages.validationBillNumberRequired)
    if (!row.description) errors.push(messages.validationDescriptionRequired)

    // Posting/document/invoice date are independent, optional dates — only checked for plausibility,
    // and only when a value is actually present. A stray number like "17" converts to a
    // syntactically valid but implausible (~1900) date, which is exactly the per-row error this
    // guards against without failing the rest of the file.
    if (row.posting_date !== null && !isPlausibleBusinessDate(row.posting_date)) {
        errors.push(`${messages.validationInvalidDate} (${messages.fieldPostingDate})`)
    }

    if (row.document_date !== null && !isPlausibleBusinessDate(row.document_date)) {
        errors.push(`${messages.validationInvalidDate} (${messages.fieldDocumentDate})`)
    }

    if (row.invoice_date !== null && !isPlausibleBusinessDate(row.invoice_date)) {
        errors.push(`${messages.validationInvalidDate} (${messages.fieldInvoiceDate})`)
    }

    if (row.amount === null) {
        errors.push(`${messages.validationAmountInvalid} (${messages.fieldTotalAmount})`)
    } else if (row.amount < 0) {
        errors.push(`${messages.validationAmountNegative} (${messages.fieldTotalAmount})`)
    }

    // paid_amount is never legitimately "missing" (blank already defaults to 0 in
    // buildGenerateFeeRow) — null here means the cell had non-blank, unparseable content.
    if (row.paid_amount === null) {
        errors.push(`${messages.validationAmountInvalid} (${messages.fieldCollectedAmount})`)
    } else if (row.paid_amount < 0) {
        errors.push(`${messages.validationAmountNegative} (${messages.fieldCollectedAmount})`)
    }

    if (row.remaining_amount === null) {
        errors.push(messages.validationDebitAmountRequired)
    } else if (row.remaining_amount < 0) {
        errors.push(`${messages.validationAmountNegative} (${messages.fieldDebitAmount})`)
    }

    row.errors = errors
    row.warnings = warnings
    recomputeRowStatus(row)
}

export function markApartmentCodeErrors(
    rows: GenerateFeeImportRow[],
    invalidApartmentCodes: Set<string>,
    message: string
): void {
    if (invalidApartmentCodes.size === 0) return

    rows.forEach(row => {
        if (!row.apartment_code) return
        if (!invalidApartmentCodes.has(row.apartment_code.toUpperCase())) return

        row.errors = [...row.errors, message]
        recomputeRowStatus(row)
    })
}

/**
 * Fills in the friendly fee-type name for rows whose bill-number prefix matched the system's fee
 * type catalog (via the existing Fee Type Management search — no Excel Master Data sheet
 * involved). A prefix that could be derived but wasn't found in the system gets a per-row warning
 * with the raw prefix shown, per the "no fee type found" business rule. This only applies to the
 * pasted-table path — an uploaded file's fee_type_code comes directly from the backend response.
 */
export function applyFeeTypeLookupResults(
    rows: GenerateFeeImportRow[],
    foundNames: Map<string, string>,
    notFoundCodes: Set<string>,
    notFoundMessage: (code: string) => string
): void {
    rows.forEach(row => {
        if (!row.fee_type_code) return

        const name = foundNames.get(row.fee_type_code)

        if (name) {
            row.fee_type_name = name

            return
        }

        if (notFoundCodes.has(row.fee_type_code)) {
            row.warnings = [...row.warnings, notFoundMessage(row.fee_type_code)]
            recomputeRowStatus(row)
        }
    })
}

export function buildGenerateFeeSummaryTotals(rows: GenerateFeeImportRow[]) {
    return {
        total_rows: rows.length,
        valid_rows: rows.filter(row => row.status === 'VALID').length,
        warning_rows: rows.filter(row => row.status === 'WARNING').length,
        error_rows: rows.filter(row => row.status === 'INVALID').length,
        orphan_rows: rows.filter(row => row.status === 'ORPHAN').length,
        total_invoice_amount: rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
    }
}

export function buildGenerateFeeRequestItem(row: GenerateFeeImportRow): GenerateFeeRequestItem {
    return {
        customer_name: row.customer_name,
        apartment_code: row.apartment_code?.trim() ?? '',
        posting_date: row.posting_date,
        document_date: row.document_date,
        bill_payment_number: row.bill_payment_number?.trim() ?? '',
        invoice_date: row.invoice_date,
        invoice_number: row.invoice_number,
        description: row.description?.trim() ?? '',
        opening_remaining_amount: row.opening_remaining_amount,
        amount: row.amount ?? 0,
        paid_amount: row.paid_amount,
        remaining_amount: row.remaining_amount,
        fee_type_code: row.fee_type_code
    }
}
