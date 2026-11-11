import type { FeeExcelImportResult, FeeExcelPreviewRow, FeeExcelValidationResult } from './feeImport.types'

const key = (value: string) => value.toLowerCase().replace(/[_\-\s]/g, '')
const field = (value: any, names: string[]) => {
  if (!value || typeof value !== 'object') return undefined
  for (const name of names) if (value[name] !== undefined && value[name] !== null) return value[name]
  const normalized = Object.fromEntries(Object.entries(value).map(([name, item]) => [key(name), item]))
  return names.map(name => normalized[key(name)]).find(item => item !== undefined && item !== null)
}
const number = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const boolean = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'Y'
}
const root = (payload: any) => payload?.data?.data ?? payload?.data ?? payload
const errors = (row: any) => {
  const value = field(row, ['errors', 'error_messages', 'errorMessages', 'error', 'message'])
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : String(item?.message ?? item?.info ?? '')).filter(Boolean)
  return typeof value === 'string' && value.trim() ? [value.trim()] : []
}
const records = (value: unknown): Record<string, unknown>[] => Array.isArray(value)
  ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
  : []
const rowNumber = (row: Record<string, unknown> | undefined) => number(field(row, ['row_number', 'rowNumber', 'excel_row', 'excelRow', 'line_number', 'lineNumber']))
const stableRowKey = (row: Record<string, unknown> | undefined) => {
  const detailId = field(row, ['fee_import_detail_id', 'feeImportDetailId', 'detail_id', 'detailId'])
  if (detailId !== undefined && detailId !== null && detailId !== '') return `detail:${detailId}`

  const excelRow = rowNumber(row)
  return excelRow === null ? null : `row:${excelRow}`
}
const validationStatusValue = (row: Record<string, unknown> | undefined): string | null => {
  const status = field(row, ['status', 'validation_status', 'validationStatus'])
  return typeof status === 'string' && status.trim() ? status.trim().toUpperCase() : null
}
const validationStatus = (row: Record<string, unknown> | undefined): boolean | null => {
  const status = validationStatusValue(row)
  if (status === 'VALID') return true
  if (status === 'INVALID') return false
  return boolean(field(row, ['is_valid', 'isValid', 'valid']))
}
const feeImportDetailId = (row: Record<string, unknown> | undefined) => number(field(row, ['fee_import_detail_id', 'feeImportDetailId', 'detail_id', 'detailId']))
const hasSequentialRowNumbers = (items: Record<string, unknown>[], validationRows: Record<string, unknown>[]) => {
  if (items.length === 0 || items.length !== validationRows.length) return false
  const first = rowNumber(validationRows[0])
  return first !== null && validationRows.every((row, index) => rowNumber(row) === first + index)
}
const rows = (payload: any): FeeExcelPreviewRow[] => {
  const data = root(payload)
  const items = records(field(data, ['items']))
  const validationRows = records(field(data, ['rows', 'preview', 'preview_rows', 'details']))
  const validationByKey = new Map(validationRows.map(row => [stableRowKey(row), row]).filter((entry): entry is [string, Record<string, unknown>] => entry[0] !== null))
  const source = items.length > 0 ? items : validationRows
  const canUseSequentialRowMapping = hasSequentialRowNumbers(items, validationRows)

  return source.map((item, index) => {
    // Match stable backend identifiers first. The positional mapping is valid only
    // for the current response contract: each parsed item has one sequential Excel row.
    const matched = validationByKey.get(stableRowKey(item) ?? '') ?? (canUseSequentialRowMapping ? validationRows[index] : undefined)
    const rowErrors = errors(matched)
    const valid = validationStatus(matched)
    return {
      rowNumber: rowNumber(matched) ?? rowNumber(item),
      values: item,
      errors: rowErrors,
      valid: valid ?? (rowErrors.length ? false : null),
      validationStatus: validationStatusValue(matched),
      isNttk: boolean(field(matched, ['is_nttk', 'isNttk', 'nttk', 'is_balance', 'isBalance'])) ?? boolean(field(item, ['is_nttk', 'isNttk', 'nttk', 'is_balance', 'isBalance'])),
      feeImportDetailId: feeImportDetailId(matched) ?? feeImportDetailId(item)
    }
  })
}
const executionId = (payload: any) => {
  const value = payload?.execution_id ?? payload?.executionId ?? root(payload)?.execution_id ?? root(payload)?.executionId
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export const mapFeeExcelValidation = (payload: any): FeeExcelValidationResult => {
  const data = root(payload)
  const previewRows = rows(payload)
  const errorRows = number(field(data, ['error_rows', 'errorRows', 'invalid_rows', 'invalidRows']))
  return {
    totalRows: number(field(data, ['total_rows', 'totalRows', 'total_count', 'totalCount'])) ?? previewRows.length,
    validRows: number(field(data, ['valid_rows', 'validRows', 'success_rows', 'successRows'])),
    errorRows,
    nttkRows: number(field(data, ['nttk_rows', 'nttkRows', 'balance_rows', 'balanceRows'])),
    rows: previewRows,
    hasBlockingErrors: boolean(field(data, ['has_blocking_errors', 'hasBlockingErrors', 'can_import', 'canImport'])) === false || (errorRows ?? 0) > 0,
    executionId: executionId(payload)
  }
}

export const mapFeeExcelImport = (payload: any): FeeExcelImportResult => {
  const data = root(payload)
  return {
    feeImportId: number(field(data, ['fee_import_id', 'feeImportId', 'import_id', 'importId'])),
    created: number(field(data, ['created_count', 'createdCount', 'inserted_count', 'insertedCount'])),
    updated: number(field(data, ['updated_count', 'updatedCount', 'overwritten_count', 'overwrittenCount'])),
    skipped: number(field(data, ['skipped_count', 'skippedCount', 'duplicate_count', 'duplicateCount'])),
    errors: number(field(data, ['error_count', 'errorCount', 'failed_count', 'failedCount'])),
    nttkRows: number(field(data, ['nttk_rows', 'nttkRows', 'balance_rows', 'balanceRows'])),
    executionId: executionId(payload)
  }
}
