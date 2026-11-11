import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { WorkflowError } from '@/shared/utils/workflowError'

import { bannerText, emptyBannerFilter } from '../components/bannerHelpers'
import { bannerService } from '../service'
import type {
  BannerDictionary,
  BannerFilterModel,
  BannerItem,
  BannerSearchResponse
} from '../types'

type Params = {
  dictionary: BannerDictionary
  sessiontoken?: string
  language?: any
  initialFilter: BannerFilterModel
  initialData: BannerSearchResponse
  initialError?: { message: string; executionId?: string } | null
}

const toBannerError = (
  dictionary: BannerDictionary,
  error: unknown
): { message: string; executionId?: string } => {
  if (error instanceof WorkflowError) {
    return {
      message: error.message || bannerText(dictionary, 'load_failed', 'Unable to load banners.'),
      executionId: error.execution_id || undefined
    }
  }

  return {
    message: error instanceof Error
      ? error.message
      : bannerText(dictionary, 'load_failed', 'Unable to load banners.')
  }
}

export function useBannerSearch({
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
  const [rows, setRows] = useState<BannerItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; executionId?: string } | null>(initialError)

  const loadData = useCallback(async (nextFilter: BannerFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await bannerService.simpleSearchBanners({
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
      setError(toBannerError(dictionary, err))

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

  const updateDraftFilter = <K extends keyof BannerFilterModel>(key: K, value: BannerFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1 })
  }

  const handleReset = () => {
    void loadData({ ...emptyBannerFilter, project_id: filter.project_id })
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
