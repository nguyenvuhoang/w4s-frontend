import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { WorkflowError } from '@/shared/utils/workflowError'

import { emptyPromotionFilter, promotionText } from '../components/promotionHelpers'
import { promotionService } from '../service'
import type {
  PromotionDictionary,
  PromotionFilterModel,
  PromotionItem,
  PromotionSearchResponse,
  PromotionWorkflowError
} from '../types'

type Params = {
  dictionary: PromotionDictionary
  sessiontoken?: string
  language?: any
  initialFilter: PromotionFilterModel
  initialData: PromotionSearchResponse
  initialError?: PromotionWorkflowError | null
}

const toPromotionError = (
  dictionary: PromotionDictionary,
  error: unknown
): PromotionWorkflowError => {
  if (error instanceof WorkflowError) {
    return {
      message: error.message || promotionText(dictionary, 'load_failed', 'Unable to load promotions.'),
      executionId: error.execution_id || undefined
    }
  }

  return {
    message: error instanceof Error
      ? error.message
      : promotionText(dictionary, 'load_failed', 'Unable to load promotions.')
  }
}

export function usePromotionSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) {
  const workingProject = useWorkingProject()
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<PromotionItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PromotionWorkflowError | null>(initialError)

  const loadData = useCallback(async (nextFilter: PromotionFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await promotionService.simpleSearchPromotions({
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
      setError(toPromotionError(dictionary, err))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  useEffect(() => {
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    void loadData({ ...draftFilter, project_id: workingProject.id, page_index: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof PromotionFilterModel>(key: K, value: PromotionFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1 })
  }

  const handleReset = () => {
    void loadData({ ...emptyPromotionFilter, project_id: filter.project_id })
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
    totalPages,
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
