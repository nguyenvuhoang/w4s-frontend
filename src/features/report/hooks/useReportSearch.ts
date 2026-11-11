import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useState } from 'react'

import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { emptyReportFilter, reportText } from '../components/reportHelpers'
import { reportService } from '../service'
import type {
  ReportDictionary,
  ReportFilterModel,
  ReportItem,
  ReportSearchResponse,
  ReportWorkflowError
} from '../types'

type Params = {
  dictionary: ReportDictionary
  sessiontoken?: string
  language?: any
  initialFilter: ReportFilterModel
  initialData: ReportSearchResponse
  initialError?: ReportWorkflowError | null
}

export function useReportSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) {
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<ReportItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ReportWorkflowError | null>(initialError)

  const loadData = useCallback(async (nextFilter: ReportFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await reportService.searchReports({
        sessiontoken,
        language,
        filter: nextFilter
      })

      const resolvedFilter = {
        ...nextFilter,
        page_index: response.page_index,
        page_size: response.page_size
      }

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)

      return response
    } catch (err) {
      setError(normalizeWorkflowErrorDetail(err, {
        fallback: reportText(dictionary, 'report_load_failed', 'Unable to load reports.')
      }))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  const updateDraftFilter = <K extends keyof ReportFilterModel>(key: K, value: ReportFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 0 })
  }

  const handleReset = () => {
    void loadData({ ...emptyReportFilter, page_size: filter.page_size })
  }

  const handleRefresh = () => {
    void loadData(filter)
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = Number(event.target.value)

    void loadData({ ...filter, page_size, page_index: 0 })
  }

  // MUI Pagination reports a 1-based page number; internal state and the API payload stay 0-based.
  const handlePageChange = (_: React.ChangeEvent<unknown>, uiPageNumber: number) => {
    void loadData({ ...filter, page_index: uiPageNumber - 1 })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const uiPageNumber = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index: uiPageNumber - 1 })
  }

  return {
    filter,
    draftFilter,
    rows,
    totalCount,
    loading,
    error,
    loadData,
    updateDraftFilter,
    handleSearch,
    handleReset,
    handleRefresh,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
