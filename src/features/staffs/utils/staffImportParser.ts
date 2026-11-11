export type StaffImportSourceInspection = {
    source_name: string
    sheet_name?: string
    row_count: number
}

export class StaffImportParseError extends Error {}

/**
 * Parses only the source container, never its columns or business values. Field mapping and
 * validation are deliberately deferred until the staff import template is provided.
 */
export async function inspectStaffImportFile(file: File): Promise<StaffImportSourceInspection> {
    try {
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const sheet_name = workbook.SheetNames[0]

        if (!sheet_name) throw new StaffImportParseError('No worksheet found in the uploaded file.')

        const worksheet = workbook.Sheets[sheet_name]
        const range = worksheet?.['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null

        return {
            source_name: file.name,
            sheet_name,
            row_count: range ? range.e.r - range.s.r + 1 : 0
        }
    } catch (error) {
        if (error instanceof StaffImportParseError) throw error

        throw new StaffImportParseError('Unable to read the Excel file.')
    }
}

export function inspectStaffImportClipboard(text: string): StaffImportSourceInspection {
    const rows = text.split(/\r?\n/).filter(row => row.trim())

    if (!rows.length) throw new StaffImportParseError('No pasted Excel data found.')

    return {
        source_name: 'Pasted data from Excel',
        row_count: rows.length
    }
}
