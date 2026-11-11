import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useState } from 'react'

import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { emptyFeeTypeFilter, feeText } from '../components/feeTypeHelpers'
import { feeService } from '../service'
import type {
  FeeDictionary,
  FeeTypeFilterModel,
  FeeTypeItem,
  FeeTypeSearchResponse,
  FeeWorkflowError
} from '../types'

type Params = {
  dictionary: FeeDictionary
  sessiontoken?: string
  language?: any
  initialFilter: FeeTypeFilterModel
  initialData: FeeTypeSearchResponse
  initialError?: FeeWorkflowError | null
}

export function useFeeTypeSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) {
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<FeeTypeItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<FeeWorkflowError | null>(initialError)

  const loadData = useCallback(async (nextFilter: FeeTypeFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await feeService.simpleSearchFeeTypes({
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
        fallback: feeText(dictionary, 'fee_type_load_failed', 'Unable to load fee types.')
      }))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  const updateDraftFilter = <K extends keyof FeeTypeFilterModel>(key: K, value: FeeTypeFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1 })
  }

  const handleReset = () => {
    void loadData(emptyFeeTypeFilter)
  }

  const handleRefresh = () => {
    void loadData(filter)
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = Number(event.target.value)

    void loadData({ ...filter, page_size, page_index: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
    void loadData({ ...filter, page_index })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index })
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
