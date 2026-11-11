import * as XLSX from 'xlsx'

export type GenerateFeeTemplateLabels = {
    sheetName: string
    reportTitle: string
    reportMeta: string
    headers: string[]
    fileName: string
}

/**
 * Builds the template entirely client-side (no backend template endpoint exists yet for this
 * screen) so the exported file always matches the single-sheet layout the parser expects: row 1
 * title, row 2 period/branch info, row 3 headers, data from row 4. No Master Data sheet — the
 * parser now resolves fee type names against the real Fee Type Management catalog instead.
 * Column count is derived from `labels.headers.length` so it always matches GENERATE_FEE_FIELD_KEYS
 * without needing a separately-maintained constant.
 */
export function downloadGenerateFeeTemplate(labels: GenerateFeeTemplateLabels): void {
    const COLUMN_COUNT = labels.headers.length

    const padRow = (cells: string[]) => [
        ...cells,
        ...Array.from({ length: Math.max(COLUMN_COUNT - cells.length, 0) }, () => '')
    ]

    const rows: unknown[][] = [
        padRow([labels.reportTitle]),
        padRow([labels.reportMeta]),
        padRow(labels.headers)
    ]

    const sheet = XLSX.utils.aoa_to_sheet(rows)

    sheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: COLUMN_COUNT - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: COLUMN_COUNT - 1 } }
    ]
    sheet['!cols'] = Array.from({ length: COLUMN_COUNT }, () => ({ wch: 20 }))

    const workbook = XLSX.utils.book_new()

    // Sheet names have a 31-char Excel limit and can't contain \ / ? * [ ] : — truncate/sanitize
    // defensively since the parser itself no longer requires a specific sheet name.
    const safeSheetName = labels.sheetName.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet1'

    XLSX.utils.book_append_sheet(workbook, sheet, safeSheetName)

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = labels.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
