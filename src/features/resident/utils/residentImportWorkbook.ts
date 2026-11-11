import ExcelJS from 'exceljs'

import type { ResidentImportValidationRow } from '../types'
import { HEADER_TO_FIELD, normalizeHeader, type ResidentImportRowField, type SupportedHeader } from './residentImport'

export class ResidentImportWorkbookParseError extends Error {}

export type ResidentImportWorkbookContext = {
    workbook: ExcelJS.Workbook
    worksheet: ExcelJS.Worksheet
    headerRowNumber: number
    columnMap: Partial<Record<ResidentImportRowField, number>>
}

const MAX_HEADER_SCAN_ROWS = 10
// A row only counts as the header row once it can resolve every field the app actually
// requires (see REQUIRED_HEADERS in residentImport.ts) — a stray row that only matches one
// or two supported header names should not be mistaken for the real header row.
const HEADER_DETECTION_REQUIRED_FIELDS: ResidentImportRowField[] = [
    'full_name',
    'identity_no',
    'apartment_code',
    'relationship_type'
]

const buildColumnMap = (row: ExcelJS.Row): Partial<Record<ResidentImportRowField, number>> => {
    const columnMap: Partial<Record<ResidentImportRowField, number>> = {}

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const normalized = normalizeHeader(String(cell.value ?? ''))
        const header = (Object.keys(HEADER_TO_FIELD) as SupportedHeader[])
            .find(candidate => normalizeHeader(candidate) === normalized)

        if (header && columnMap[HEADER_TO_FIELD[header]] === undefined) {
            columnMap[HEADER_TO_FIELD[header]] = colNumber
        }
    })

    return columnMap
}

const detectHeaderRow = (worksheet: ExcelJS.Worksheet) => {
    const scanLimit = Math.min(MAX_HEADER_SCAN_ROWS, worksheet.rowCount)

    for (let rowNumber = 1; rowNumber <= scanLimit; rowNumber++) {
        const columnMap = buildColumnMap(worksheet.getRow(rowNumber))

        if (HEADER_DETECTION_REQUIRED_FIELDS.every(field => columnMap[field] !== undefined)) {
            return { headerRowNumber: rowNumber, columnMap }
        }
    }

    return null
}

/**
 * Loads the raw uploaded file into an in-memory ExcelJS workbook (preserving sheets, styles,
 * and everything else already in the file) so later edits can be written back into the exact
 * same cells instead of regenerating a brand-new spreadsheet from the preview table's data.
 */
export async function parseResidentImportWorkbook(file: File): Promise<ResidentImportWorkbookContext> {
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()

    // ExcelJS's TS typings declare Node's `Buffer` for this parameter, but its runtime loader
    // (JSZip) accepts a plain ArrayBuffer just fine in the browser — this cast only bridges the
    // type, not the behavior. `as any` (rather than `as unknown as Buffer`) is used deliberately:
    // this dependency tree has two structurally different `Buffer` type declarations in scope
    // (differing by newer Node.js resizable-ArrayBuffer members such as `maxByteLength` /
    // `resizable` / `resize` / `detached`), so a `Buffer`-typed cast can itself fail to satisfy
    // ExcelJS's own `Buffer` type — `any` sidesteps that mismatch entirely without touching runtime behavior.
    await workbook.xlsx.load(buffer as any)

    const worksheet = workbook.worksheets[0]

    if (!worksheet) {
        throw new ResidentImportWorkbookParseError('No worksheet found in the uploaded file.')
    }

    const detected = detectHeaderRow(worksheet)

    if (!detected) {
        throw new ResidentImportWorkbookParseError('Unable to detect the import template header row.')
    }

    return {
        workbook,
        worksheet,
        headerRowNumber: detected.headerRowNumber,
        columnMap: detected.columnMap
    }
}

/**
 * Writes an edited validation row back onto its original worksheet row. `row.row_number` is the
 * real 1-based Excel row the backend validator reported the row at, so it is used directly as the
 * write target — never the row's position in a (possibly re-sorted) preview table.
 */
export function applyResidentImportRowToWorkbook(
    context: ResidentImportWorkbookContext,
    row: ResidentImportValidationRow
) {
    const excelRowNumber = row.row_number

    if (!excelRowNumber || excelRowNumber <= context.headerRowNumber) return

    const excelRow = context.worksheet.getRow(excelRowNumber)
    const fieldValues: Record<ResidentImportRowField, string | null> = {
        full_name: row.full_name,
        phone_number: row.phone_number,
        email: row.email,
        identity_no: row.identity_no,
        date_of_birth: row.date_of_birth,
        gender: row.gender,
        apartment_code: row.apartment_code,
        relationship_type: row.relationship_type,
        is_owner: row.is_owner,
        move_in_date: row.move_in_date,
        note: row.note
    };

    (Object.keys(fieldValues) as ResidentImportRowField[]).forEach(field => {
        const colNumber = context.columnMap[field]

        if (colNumber === undefined) return

        excelRow.getCell(colNumber).value = fieldValues[field] ?? null
    })
}

const RESIDENT_IMPORT_XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * Serializes the current in-memory workbook (with all edits applied so far) back into a File,
 * so it can be re-submitted to the same validate endpoint used for the original upload.
 */
export async function exportResidentImportWorkbookAsFile(
    context: ResidentImportWorkbookContext,
    fileName: string
): Promise<File> {
    const buffer = await context.workbook.xlsx.writeBuffer()

    return new File([buffer], fileName, { type: RESIDENT_IMPORT_XLSX_MIME_TYPE })
}

export async function downloadResidentImportWorkbook(
    context: ResidentImportWorkbookContext,
    fileName: string
): Promise<void> {
    const buffer = await context.workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: RESIDENT_IMPORT_XLSX_MIME_TYPE })
    const { saveAs } = await import('file-saver')

    saveAs(blob, fileName)
}
