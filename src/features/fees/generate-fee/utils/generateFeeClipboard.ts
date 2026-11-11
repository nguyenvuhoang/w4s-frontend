import type { GenerateFeeValidationSummary } from '../types'
import {
    buildGenerateFeeRow,
    buildGenerateFeeSummaryTotals,
    countHeaderAliasMatches,
    GENERATE_FEE_FIELD_KEYS,
    isBlankRowCells,
    isTotalSummaryRow,
    resolveGenerateFeeColumnIndexes,
    validateGenerateFeeRow,
    type GenerateFeeMessages
} from './generateFeeValidation'

export type GenerateFeeClipboardMessages = GenerateFeeMessages & {
    clipboardEmpty: string
    clipboardNoRows: string
    clipboardSourceName: string
}

// A pasted first line is treated as a header row (and skipped) once most of its cells match a
// known column-name alias — reused from generateFeeValidation so both the legacy template
// ("Mã căn hộ", "Ngày bắt đầu"...) and the current customer template ("Mã khách hàng", "Ngày hạch
// toán"...) are recognized without hardcoding either header set here.
const HEADER_MATCH_THRESHOLD = Math.ceil(GENERATE_FEE_FIELD_KEYS.length * 0.6)

export function parseGenerateFeeClipboardText(
    clipboardText: string,
    messages: GenerateFeeClipboardMessages,
    locale?: string
): GenerateFeeValidationSummary {
    const sourceText = clipboardText.replace(/^﻿/, '')

    if (!sourceText.replace(/[\t\r\n ]/g, '')) {
        throw new Error(messages.clipboardEmpty)
    }

    const lines = sourceText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '')
    const firstLineCells = (lines[0] ?? '').split('\t')
    const hasHeaderRow = countHeaderAliasMatches(firstLineCells) >= HEADER_MATCH_THRESHOLD
    const dataLines = hasHeaderRow ? lines.slice(1) : lines
    const columnIndexes = resolveGenerateFeeColumnIndexes(hasHeaderRow ? firstLineCells : null)

    const rows: GenerateFeeValidationSummary['rows'] = []

    dataLines.forEach((line, index) => {
        const cells = line.split('\t')

        if (isBlankRowCells(cells) || isTotalSummaryRow(cells)) return

        const rowNumber = index + 1
        const row = buildGenerateFeeRow(rowNumber, cells, locale, columnIndexes)

        validateGenerateFeeRow(row, messages)
        rows.push(row)
    })

    if (rows.length === 0) {
        throw new Error(messages.clipboardNoRows)
    }

    return {
        source_name: messages.clipboardSourceName,
        report_info: null,
        column_headers: null,
        rows,
        sheet_preview: null,
        ...buildGenerateFeeSummaryTotals(rows)
    }
}
