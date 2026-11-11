import type { FeeDictionary } from '../types'

export type GenerateFeePageProps = {
    dictionary: FeeDictionary
    locale: string
    sessiontoken?: string
}

export type GenerateFeeImportSourceMode = 'file' | 'clipboard'

/** ORPHAN = a detail row the backend returned with no matching validation entry — data present but
 *  never actually confirmed by validation, so it must never be silently counted as submittable. */
export type GenerateFeeRowStatus = 'VALID' | 'WARNING' | 'INVALID' | 'ORPHAN'

export type GenerateFeeImportRow = {
    row_number: number
    status: GenerateFeeRowStatus
    customer_name: string | null
    /** "Mã khách hàng" in the current template (accepts the legacy "Mã căn hộ" header too). */
    apartment_code: string | null
    posting_date: string | null
    document_date: string | null
    /** Matches the backend's `bill_payment_number` field name exactly — see /api/fees/import-validate. */
    bill_payment_number: string | null
    invoice_date: string | null
    invoice_number: string | null
    description: string | null
    /** "Số còn phải thu ĐK" (opening balance) — absent from older 9-column template files. */
    opening_remaining_amount: number | null
    amount: number | null
    paid_amount: number | null
    remaining_amount: number | null
    fee_type_code: string | null
    fee_type_name: string | null
    /** Present only on rows mapped from the backend validation response (join key back to the created fee record). */
    fee_invoice_id: string | number | null
    errors: string[]
    warnings: string[]
}

/**
 * Ordered, generic readout of the sheet's preamble rows (everything above the header row):
 * every non-empty cell across every populated column, row-major then column-order, with any
 * embedded line breaks split out — so a report title, branch/account/period info, and a note
 * living in separate merged ranges (or separate lines within one merged cell) all surface as
 * their own line, in the same order they appear in the file. No single cell is hardcoded.
 */
export type GenerateFeeReportInfo = {
    lines: string[]
}

export type GenerateFeeSheetPreview = {
    sheet_name: string
    rows: unknown[][]
    truncated: boolean
}

export type GenerateFeeValidationSummary = {
    source_name: string
    report_info: GenerateFeeReportInfo | null
    /** Row 3 header labels read directly from the file, used as-is for the preview table's data columns. */
    column_headers: string[] | null
    total_rows: number
    valid_rows: number
    warning_rows: number
    error_rows: number
    orphan_rows: number
    total_invoice_amount: number
    rows: GenerateFeeImportRow[]
    sheet_preview: GenerateFeeSheetPreview | null
    /**
     * Raw backend detail item per row (same index as `rows`), exactly as returned by
     * /api/fees/import-validate — used to build the Import submit payload unchanged, preserving
     * every field the backend returned (not just the ones re-mapped into GenerateFeeImportRow).
     * Only populated for the backend-validated file-upload path; the pasted-table (clipboard) path
     * has no separate backend object per row, so this stays undefined there.
     */
    raw_items?: unknown[]
}

export type GenerateFeeRequestItem = {
    customer_name: string | null
    apartment_code: string
    posting_date: string | null
    document_date: string | null
    bill_payment_number: string
    invoice_date: string | null
    invoice_number: string | null
    description: string
    opening_remaining_amount: number | null
    amount: number
    paid_amount: number | null
    remaining_amount: number | null
    fee_type_code: string | null
}

/**
 * Single source of truth for the duplicate-handling policy sent to POST /api/fees/import
 * (-> ips/api/fee-invoices/import) — invoices that already exist get updated with the imported
 * file's data, never skipped. Referenced everywhere the value is needed instead of repeating the
 * 'UPDATE' literal.
 */
export const GENERATE_FEE_DUPLICATE_POLICY = 'UPDATE' as const
export type GenerateFeeDuplicatePolicy = typeof GENERATE_FEE_DUPLICATE_POLICY

export type GenerateFeeSubmitPayload = {
    project_id: number
    file_name: string
    notes: string
    duplicate_policy: GenerateFeeDuplicatePolicy
    /** Raw backend items (see GenerateFeeValidationSummary.raw_items) when available, otherwise
     *  GenerateFeeRequestItem[] built from the pasted-table rows — see GenerateFeeImportPage.tsx. */
    items: unknown[]
}

/**
 * All counts are optional: POST /api/fees/import's actual response fields aren't confirmed yet,
 * so the UI must only display whichever of these the backend actually returns rather than
 * inventing zeros for fields that never came back.
 */
export type GenerateFeeSubmitResult = {
    total_count: number | null
    created_count: number | null
    updated_count: number | null
    skipped_count: number | null
    error_count: number | null
    execution_id: string | null
}
