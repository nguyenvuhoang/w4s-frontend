import * as XLSX from 'xlsx'

import type {
    GenerateFeeSheetPreview,
    GenerateFeeValidationSummary
} from '../types'
import { normalizeTextCell } from './generateFeeCell'
import {
    buildGenerateFeeRow,
    buildGenerateFeeSummaryTotals,
    GENERATE_FEE_FIELD_KEYS,
    isBlankRowCells,
    isTotalSummaryRow,
    resolveGenerateFeeColumnIndexes,
    validateGenerateFeeRow,
    type GenerateFeeColumnIndexes,
    type GenerateFeeMessages
} from './generateFeeValidation'

// Preferred legacy sheet name, kept only as a first choice — the customer's current file uses a
// completely different sheet name ("CHI TIẾT CÔNG NỢ PHẢI THU THEO...") and ships a single sheet,
// so the sheet name itself must never be a hard requirement (see resolveDataSheetName below).
export const DATA_IMPORT_SHEET_NAME = 'Data Import'

// Sheet layout: rows 1-2 are a free-form report preamble (title, then period/branch/account
// info — each possibly in its own merged range across different columns), row 3 is the header
// row, row 4+ is the first actual data row.
const HEADER_ROW_INDEX = 2
const DATA_START_ROW_INDEX = 3
const MAX_SHEET_PREVIEW_ROWS = 1000

export class GenerateFeeWorkbookError extends Error {}

const sheetToRows = (sheet: XLSX.WorkSheet): unknown[][] => (
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true })
)

const toDisplayCell = (value: unknown): unknown => {
    if (value instanceof Date) {
        const pad = (num: number) => String(num).padStart(2, '0')

        return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`
    }

    return value
}

/**
 * Prefers a sheet literally named "Data Import" (legacy template), otherwise falls back to the
 * first sheet that actually has any non-blank row — sheet names are not assumed stable.
 */
const resolveDataSheetName = (workbook: XLSX.WorkBook): string | undefined => {
    const legacyName = workbook.SheetNames.find(name => name.trim().toLowerCase() === DATA_IMPORT_SHEET_NAME.toLowerCase())

    if (legacyName) return legacyName

    return workbook.SheetNames.find(name => sheetToRows(workbook.Sheets[name]).some(row => !isBlankRowCells(row)))
}

/**
 * Reads every populated cell across every column (not just column A) of the rows above the
 * header row, in row-major/column order, splitting any embedded line breaks — so a title, and
 * branch/account/period/note info sitting in separate merged ranges of the same row, each
 * surface as their own line in the exact order they appear in the sheet.
 */
const extractReportInfoLines = (allRows: unknown[][], headerRowIndex: number): string[] => {
    const lines: string[] = []

    for (let rowIndex = 0; rowIndex < headerRowIndex; rowIndex++) {
        const row = allRows[rowIndex] ?? []

        row.forEach(cell => {
            const text = normalizeTextCell(cell)

            if (!text) return

            text.split(/\r\n|\r|\n/).forEach(segment => {
                const trimmed = segment.trim()

                if (trimmed) lines.push(trimmed)
            })
        })
    }

    return lines
}

/**
 * Builds the displayed column labels (one per GENERATE_FEE_FIELD_KEYS entry) from the header
 * row's own text, read at each field's *resolved* column index (not raw file order) — so if a
 * column ever sits somewhere other than its expected position, the label shown still matches
 * the data actually rendered under it.
 */
const extractColumnHeaders = (headerRow: unknown[] | undefined, columnIndexes: GenerateFeeColumnIndexes): string[] => (
    GENERATE_FEE_FIELD_KEYS.map(field => normalizeTextCell((headerRow ?? [])[columnIndexes[field]]) ?? '')
)

export function parseGenerateFeeWorkbookBuffer(
    buffer: ArrayBuffer,
    fileName: string,
    messages: GenerateFeeMessages,
    sheetNotFoundMessage: string,
    noRowsFoundMessage: string,
    locale?: string
): GenerateFeeValidationSummary {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const dataSheetName = resolveDataSheetName(workbook)

    if (!dataSheetName) {
        throw new GenerateFeeWorkbookError(sheetNotFoundMessage)
    }

    const dataSheet = workbook.Sheets[dataSheetName]
    const allRows = sheetToRows(dataSheet)

    const reportInfoLines = extractReportInfoLines(allRows, HEADER_ROW_INDEX)
    const columnIndexes = resolveGenerateFeeColumnIndexes(allRows[HEADER_ROW_INDEX])
    const columnHeaders = extractColumnHeaders(allRows[HEADER_ROW_INDEX], columnIndexes)

    const rows = allRows.slice(DATA_START_ROW_INDEX).reduce<GenerateFeeValidationSummary['rows']>((acc, cells, index) => {
        // Skip fully-blank rows and the trailing "Tổng cộng" summary line — neither is real data.
        if (isBlankRowCells(cells) || isTotalSummaryRow(cells)) return acc

        const rowNumber = DATA_START_ROW_INDEX + index + 1 // 1-based Excel row number
        const row = buildGenerateFeeRow(rowNumber, cells, locale, columnIndexes)

        validateGenerateFeeRow(row, messages)
        acc.push(row)

        return acc
    }, [])

    if (rows.length === 0) {
        throw new GenerateFeeWorkbookError(noRowsFoundMessage)
    }

    const sheetPreview: GenerateFeeSheetPreview = {
        sheet_name: dataSheetName,
        rows: allRows.slice(0, MAX_SHEET_PREVIEW_ROWS).map(row => row.map(toDisplayCell)),
        truncated: allRows.length > MAX_SHEET_PREVIEW_ROWS
    }

    return {
        source_name: fileName,
        report_info: reportInfoLines.length > 0 ? { lines: reportInfoLines } : null,
        column_headers: columnHeaders,
        rows,
        sheet_preview: sheetPreview,
        ...buildGenerateFeeSummaryTotals(rows)
    }
}

export async function parseGenerateFeeWorkbookFile(
    file: File,
    messages: GenerateFeeMessages,
    sheetNotFoundMessage: string,
    noRowsFoundMessage: string,
    locale?: string
): Promise<GenerateFeeValidationSummary> {
    const buffer = await file.arrayBuffer()

    return parseGenerateFeeWorkbookBuffer(buffer, file.name, messages, sheetNotFoundMessage, noRowsFoundMessage, locale)
}
