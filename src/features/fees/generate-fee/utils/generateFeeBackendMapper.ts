import type { GenerateFeeImportRow, GenerateFeeValidationSummary } from '../types'
import { buildGenerateFeeSummaryTotals, createEmptyGenerateFeeRow } from './generateFeeValidation'

/**
 * Confirmed contract for /api/fees/import-validate (-> ips/api/feeexcelimport/validate): the
 * response carries two separate collections —
 *  - a detail/business collection, one entry per Excel row: bill_payment_number, description,
 *    amount, paid_amount, remaining_amount, opening_remaining_amount, fee_type_code,
 *    customer_name, apartment_code, posting_date, document_date, invoice_date, invoice_number.
 *  - `rows`: validation results only — row_number, status, errors, fee_invoice_id.
 * These must be merged (by index when both collections are the same length — the common case,
 * and unambiguous; by apartment_code + bill_payment_number only as a fallback when they aren't,
 * since that composite key can repeat across rows) — `rows` alone is never used as the table's
 * data source, and only these exact field names are read (no document_number/voucher_number/
 * bill_number aliases — the contract is confirmed, not guessed. `invoice_number` IS a distinct
 * real field, it must never be confused with `bill_payment_number`).
 */

type BackendDetailItem = {
    customer_name?: string | null
    apartment_code?: string | null
    posting_date?: string | null
    document_date?: string | null
    bill_payment_number?: string | null
    invoice_date?: string | null
    invoice_number?: string | null
    fee_type_code?: string | null
    description?: string | null
    opening_remaining_amount?: number | string | null
    amount?: number | string | null
    paid_amount?: number | string | null
    remaining_amount?: number | string | null
    // Present when the backend ships everything in a single merged collection instead of two.
    row_number?: number | string
    status?: string
    errors?: unknown[]
    warnings?: unknown[]
    fee_invoice_id?: string | number | null
}

type BackendValidationRow = {
    row_number?: number | string
    status?: string
    errors?: unknown[]
    warnings?: unknown[]
    fee_invoice_id?: string | number | null
    apartment_code?: string | null
    bill_payment_number?: string | null
}

const toStringOrNull = (value: unknown): string | null => {
    if (value === null || value === undefined) return null

    const text = String(value).trim()

    return text ? text : null
}

const toNullableNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key)

const isDetailItemShape = (value: unknown): value is BackendDetailItem => (
    Boolean(value) && typeof value === 'object'
    && (hasOwn(value as object, 'bill_payment_number') || hasOwn(value as object, 'customer_name') || hasOwn(value as object, 'amount'))
)

const isValidationRowShape = (value: unknown): value is BackendValidationRow => (
    Boolean(value) && typeof value === 'object'
    && (hasOwn(value as object, 'row_number') || hasOwn(value as object, 'status') || hasOwn(value as object, 'fee_invoice_id'))
)

/**
 * Depth-first scan for the two collections by the *shape* of their items rather than a guessed
 * wrapper key name (e.g. `data`, `items`, `details` are all plausible and unconfirmed) — this
 * keeps the mapper correct even if the exact envelope key changes.
 */
const findArraysByShape = (root: unknown): { detailItems: BackendDetailItem[]; validationRows: BackendValidationRow[] } => {
    const arrays: unknown[][] = []
    const visited = new Set<unknown>()

    const visit = (value: unknown, depth: number) => {
        if (!value || typeof value !== 'object' || depth > 4 || visited.has(value)) return

        visited.add(value)

        if (Array.isArray(value)) {
            arrays.push(value)

            return
        }

        Object.values(value).forEach(child => visit(child, depth + 1))
    }

    visit(root, 0)

    const detailArray = arrays.find(arr => arr.length > 0 && isDetailItemShape(arr[0]))
    const validationArray = arrays.find(arr => arr.length > 0 && isValidationRowShape(arr[0]) && arr !== detailArray)

    return {
        detailItems: (detailArray ?? []) as BackendDetailItem[],
        validationRows: (validationArray ?? []) as BackendValidationRow[]
    }
}

const buildMergeKey = (apartmentCode: unknown, billPaymentNumber: unknown): string => (
    `${String(apartmentCode ?? '').trim().toUpperCase()}|${String(billPaymentNumber ?? '').trim().toUpperCase()}`
)

const mapBackendErrorMessages = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []

    return value
        .map(error => {
            const message = (error as any)?.info ?? (error as any)?.message ?? error

            return String(message ?? '').trim()
        })
        // The backend currently emits a bare "0" placeholder entry (string, not the number 0) on
        // rows with no real message — that must never survive to render as an error/warning, and
        // must never be what marks a row INVALID. Only a genuine message/code (e.g.
        // "ips.feetype.code.notfound") counts as a real entry.
        .filter(message => message !== '' && message !== '0')
}

const mapMergedRow = (
    item: BackendDetailItem,
    validationRow: BackendValidationRow | undefined,
    fallbackRowNumber: number,
    isOrphan: boolean,
    orphanMessage: string
): GenerateFeeImportRow => {
    // Validation-collection fields win when a separate `rows` entry was matched; otherwise fall
    // back to the same fields living directly on the detail item (single merged-collection case).
    const rowNumberSource = validationRow?.row_number ?? item.row_number
    const errorsSource = validationRow?.errors ?? item.errors
    const warningsSource = validationRow?.warnings ?? item.warnings
    const feeInvoiceIdSource = validationRow?.fee_invoice_id ?? item.fee_invoice_id

    const rowNumber = Number(rowNumberSource)
    const row = createEmptyGenerateFeeRow(Number.isFinite(rowNumber) ? rowNumber : fallbackRowNumber)

    row.customer_name = toStringOrNull(item.customer_name)
    row.apartment_code = toStringOrNull(item.apartment_code)?.toUpperCase() ?? null
    row.posting_date = toStringOrNull(item.posting_date)
    row.document_date = toStringOrNull(item.document_date)
    row.bill_payment_number = toStringOrNull(item.bill_payment_number)
    row.invoice_date = toStringOrNull(item.invoice_date)
    row.invoice_number = toStringOrNull(item.invoice_number)
    row.description = toStringOrNull(item.description)
    row.opening_remaining_amount = toNullableNumber(item.opening_remaining_amount)
    row.amount = toNullableNumber(item.amount)
    row.paid_amount = toNullableNumber(item.paid_amount) ?? 0
    row.remaining_amount = toNullableNumber(item.remaining_amount)
    // fee_type_code always comes from the backend response here — never re-derived client-side
    // from bill_payment_number (e.g. "OPN" must not be invented as a fee type).
    row.fee_type_code = toStringOrNull(item.fee_type_code)
    row.fee_invoice_id = feeInvoiceIdSource ?? null

    const errors = mapBackendErrorMessages(errorsSource)
    const warnings = mapBackendErrorMessages(warningsSource)

    row.errors = errors
    // The normalized errors/warnings arrays are the sole authority for row status — the backend's
    // raw `status` field is intentionally never consulted here. It currently says "INVALID" on
    // rows whose only "error" is the bogus "0" placeholder (see mapBackendErrorMessages), which
    // would incorrectly keep marking an otherwise-clean row as invalid if it were still consulted.
    if (errors.length > 0) {
        row.warnings = warnings
        row.status = 'INVALID'
    } else if (isOrphan) {
        // A detail row with no matching validation entry was never actually confirmed by the
        // backend — it must read as its own distinct status, not silently pass as VALID/WARNING.
        row.warnings = warnings.length > 0 ? warnings : [orphanMessage]
        row.status = 'ORPHAN'
    } else if (warnings.length > 0) {
        row.warnings = warnings
        row.status = 'WARNING'
    } else {
        row.warnings = warnings
        row.status = 'VALID'
    }

    return row
}

export function mapGenerateFeeBackendValidationResponse(
    response: unknown,
    sourceFileName: string,
    orphanMessage: string = 'No matching validation result was found for this row.'
): GenerateFeeValidationSummary {
    const root = (response as any)?.data ?? response
    const { detailItems, validationRows } = findArraysByShape(root)

    // apartment_code + bill_payment_number is NOT always unique in this dataset (e.g. the same
    // customer/document number can legitimately repeat across periods, especially "OPN" opening
    // rows) — a same-key match could silently bind two different detail rows to one validation
    // entry, duplicating row_number/status/errors. Index-based pairing is unambiguous (each index
    // used exactly once) and both collections represent the same Excel rows in the same order, so
    // it is the primary strategy whenever the lengths line up; the composite key is only a
    // best-effort fallback when they don't.
    const sameLength = detailItems.length > 0 && detailItems.length === validationRows.length

    const validationByKey = new Map<string, BackendValidationRow>()

    if (!sameLength) {
        validationRows.forEach(validationRow => {
            const key = buildMergeKey(validationRow.apartment_code, validationRow.bill_payment_number)

            if (key !== '|') validationByKey.set(key, validationRow)
        })
    }

    // If no detail collection could be identified by shape, fall back to the validation rows
    // themselves so the table isn't left empty — degraded (no business fields), never silently blank.
    const sourceItems: BackendDetailItem[] = detailItems.length > 0 ? detailItems : validationRows

    const rows = sourceItems.map((item, index) => {
        const validationRow = sameLength
            ? validationRows[index]
            : validationByKey.get(buildMergeKey(item.apartment_code, item.bill_payment_number))

        // Only meaningful when a separate `rows` collection actually exists — if there's just one
        // merged collection (or none at all), there's nothing to be "orphaned" from.
        const isOrphan = validationRows.length > 0 && !validationRow

        return mapMergedRow(item, validationRow, index + 1, isOrphan, orphanMessage)
    })

    if (process.env.NODE_ENV !== 'production' && rows[0]) {
        // eslint-disable-next-line no-console
    }

    return {
        source_name: sourceFileName,
        report_info: null,
        column_headers: null,
        rows,
        sheet_preview: null,
        // Same order/index as `rows` — see GenerateFeeValidationSummary.raw_items in types.ts.
        raw_items: sourceItems,
        ...buildGenerateFeeSummaryTotals(rows)
    }
}
