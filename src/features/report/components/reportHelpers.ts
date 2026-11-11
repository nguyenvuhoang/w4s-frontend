import type { ReportDictionary, ReportFilterModel } from '../types'

export const emptyReportFilter: ReportFilterModel = {
  search_text: '',
  page_index: 0,
  page_size: 10
}

export const reportText = (dictionary: ReportDictionary, key: string, fallback: string) => (
  dictionary.report?.[key] ?? fallback
)

export const commonText = (dictionary: ReportDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)
