import type { FeeDictionary, FeePeriodItem, FeeProjectOption } from '../types'

export type FeeExcelDuplicatePolicy = 'SKIP' | 'UPDATE'

export type FeeExcelPreviewRow = {
  rowNumber: number | null
  values: Record<string, unknown>
  errors: string[]
  valid: boolean | null
  validationStatus: string | null
  isNttk: boolean | null
  feeImportDetailId: number | null
}

export type FeeExcelValidationResult = {
  totalRows: number | null
  validRows: number | null
  errorRows: number | null
  nttkRows: number | null
  rows: FeeExcelPreviewRow[]
  hasBlockingErrors: boolean
  executionId: string | null
}

export type FeeExcelImportResult = {
  feeImportId: number | null
  created: number | null
  updated: number | null
  skipped: number | null
  errors: number | null
  nttkRows: number | null
  executionId: string | null
}

export type FeeImportPageProps = {
  dictionary: FeeDictionary
  locale: string
  sessiontoken?: string
}

export type FeeImportPickerState = {
  projects: FeeProjectOption[]
  periods: FeePeriodItem[]
}
