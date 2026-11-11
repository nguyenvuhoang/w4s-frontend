import { splitFeeInvoiceBalance } from '../components/feeInvoiceHelpers'

import type { FeeImportDetail, FeeImportDetailRow, FeeImportDetailSearchResponse, FeeImportFilter, FeeImportItem, FeeImportSearchResponse } from './feeImportWorkflow.types'

const compact = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')
type RecordValue = Record<string, unknown>
const isRecord = (input: unknown): input is RecordValue => Boolean(input) && typeof input === 'object' && !Array.isArray(input)
const record = (input: unknown): RecordValue | null => isRecord(input) ? input : null
const value = (source: unknown, names: string[]) => {
  const sourceRecord = record(source)
  if (!sourceRecord) return undefined
  for (const name of names) if (sourceRecord[name] !== undefined && sourceRecord[name] !== null) return sourceRecord[name]
  const values = Object.fromEntries(Object.entries(sourceRecord).map(([key, item]) => [compact(key), item]))
  return names.map(name => values[compact(name)]).find(item => item !== undefined && item !== null)
}
const number = (input: unknown): number | null => input === null || input === undefined || input === '' || !Number.isFinite(Number(input)) ? null : Number(input)
const text = (input: unknown): string | null => input === null || input === undefined || input === '' ? null : String(input)
const child = (source: unknown, key: string): unknown => record(source)?.[key]
const root = (response: unknown): unknown => child(child(child(response, 'payload'), 'dataresponse'), 'data') ?? child(child(response, 'payload'), 'dataresponse') ?? child(child(response, 'data'), 'data') ?? child(response, 'data') ?? response
const items = (source: unknown): unknown[] => {
  const nestedItems = child(source, 'items')
  return Array.isArray(source) ? source : Array.isArray(nestedItems) ? nestedItems : []
}
const page = (source: unknown, request: FeeImportFilter) => ({
  total_count: number(value(source, ['total_count', 'totalCount'])) ?? 0,
  page_size: number(value(source, ['page_size', 'pageSize'])) ?? request.page_size,
  page_index: number(value(source, ['page_index', 'pageIndex'])) ?? request.page_index,
  total_pages: number(value(source, ['total_pages', 'totalPages'])) ?? 0
})
export const mapFeeImportItem = (source: unknown): FeeImportItem => ({
  id: number(value(source, ['id', 'fee_import_id', 'feeImportId'])), project_id: number(value(source, ['project_id', 'projectId'])),
  import_code: text(value(source, ['import_code', 'importCode'])) ?? '', file_name: text(value(source, ['file_name', 'fileName'])) ?? '', notes: text(value(source, ['notes', 'note'])),
  total_rows: number(value(source, ['total_rows', 'totalRows'])), imported_count: number(value(source, ['imported_count', 'importedCount', 'success_count'])), skipped_count: number(value(source, ['skipped_count', 'skippedCount'])), updated_count: number(value(source, ['updated_count', 'updatedCount'])), error_count: number(value(source, ['error_count', 'errorCount'])),
  import_date: text(value(source, ['import_date', 'importDate', 'imported_on_utc', 'importedOnUtc', 'creation_time', 'created_at'])), status: text(value(source, ['status', 'system_status'])) ?? '', system_status: text(value(source, ['system_status', 'systemStatus'])), project_name: text(value(source, ['project_name', 'projectName'])), fee_period_name: text(value(source, ['period_name', 'fee_period_name', 'feePeriodName']))
})
export const mapFeeImportDetail = (response: unknown): FeeImportDetail => {
  const source = root(response)
  return mapFeeImportItem(child(source, 'import') ?? source)
}
export const mapFeeImportSearch = (response: unknown, request: FeeImportFilter): FeeImportSearchResponse => {
  const source = root(response); const meta = page(source, request)
  return { ...meta, items: items(source).map(mapFeeImportItem), has_previous_page: Boolean(value(source, ['has_previous_page', 'hasPreviousPage'])), has_next_page: Boolean(value(source, ['has_next_page', 'hasNextPage'])) }
}
export const mapFeeImportDetailRows = (response: unknown, request: FeeImportFilter): FeeImportDetailSearchResponse => {
  const source = root(response); const meta = page(source, request)
  return { ...meta, period_name: text(value(child(source, 'import') ?? source, ['period_name'])), items: items(source).map((row): FeeImportDetailRow => ({ id: number(value(row, ['id', 'fee_import_detail_id'])), apartment_code: text(value(row, ['apartment_code', 'full_unit_code', 'unit_code'])), fee_type: text(value(row, ['fee_type_name', 'fee_type', 'fee_type_code'])), document_code: text(value(row, ['document_code', 'bill_number', 'voucher_code'])), description: text(value(row, ['description', 'notes'])), amount: number(value(row, ['amount', 'total_amount'])), outstanding_amount: number(value(row, ['outstanding_amount'])), system_status: text(value(row, ['system_status', 'status'])) ?? '', error_message: text(value(row, ['error_message', 'error', 'message'])) })) }
}
// Fee import detail rows use outstanding_amount; the split rule is shared with fee management.
export const splitOutstandingAmount = splitFeeInvoiceBalance
