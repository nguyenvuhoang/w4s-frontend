import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { commonText, emptyWorkflowFilter, workflowText } from '../components/workflowHelpers'
import { workflowService } from '../services/workflowService'
import type { WorkflowFilterModel, WorkflowSearchResponse, WorkflowsDictionary } from '../types'
import { WorkflowApiError } from '../types'

type Params = {
  dictionary: WorkflowsDictionary
  language: Locale
  initialFilter?: WorkflowFilterModel
  initialData?: WorkflowSearchResponse
}

const DEBOUNCE_MS = 450

export const useWorkflowSearch = ({
  dictionary,
  language,
  initialFilter = emptyWorkflowFilter,
  initialData = workflowService.getDefaultSearchResponse(initialFilter)
}: Params) => {
  const router = useRouter()
  const searchVersionRef = useRef(0)
  const hasMountedRef = useRef(false)
  const filterRef = useRef<WorkflowFilterModel>(initialFilter)
  const [filter, setFilter] = useState<WorkflowFilterModel>(initialFilter)
  const [draftSearchText, setDraftSearchText] = useState(initialFilter.search_text)
  const [response, setResponse] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; executionId?: string } | null>(null)

  const formatError = useCallback((caught: unknown) => {
    if (caught instanceof WorkflowApiError && caught.nextAction === 'logout') {
      router.push(`/${language}/logout`)
    }

    const message = caught instanceof Error
      ? caught.message
      : workflowText(dictionary, 'load_failed', 'Unable to load workflows.')
    const executionId = caught instanceof WorkflowApiError ? caught.executionId : undefined

    return { message, executionId }
  }, [dictionary, language, router])

  const loadData = useCallback(async (nextFilter: WorkflowFilterModel) => {
    const requestVersion = ++searchVersionRef.current

    setLoading(true)
    setError(null)

    try {
      const result = await workflowService.searchWorkflows({ language, filter: nextFilter })

      if (requestVersion !== searchVersionRef.current) return undefined

      const resolvedFilter = {
        ...nextFilter,
        page_index: result.page_index,
        page_size: result.page_size
      }

      setResponse(result)
      setFilter(resolvedFilter)
      filterRef.current = resolvedFilter
      setDraftSearchText(resolvedFilter.search_text)

      return result
    } catch (caught) {
      if (requestVersion === searchVersionRef.current) {
        setError(formatError(caught))
      }

      return undefined
    } finally {
      if (requestVersion === searchVersionRef.current) {
        setLoading(false)
      }
    }
  }, [formatError, language])

  useEffect(() => {
    void loadData(initialFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true

      return
    }

    const timer = window.setTimeout(() => {
      void loadData({ ...filterRef.current, search_text: draftSearchText, page_index: 0 })
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [draftSearchText, loadData])

  const handleSearchTextChange = (value: string) => {
    setDraftSearchText(value)
  }

  const handleSearch = () => void loadData({ ...filter, search_text: draftSearchText, page_index: 0 })
  const handleRefresh = () => void loadData({ ...filter, search_text: '', page_index: 0 })

  const handleChannelChange = (channelId: string) => {
    void loadData({ ...filter, search_text: draftSearchText, channel_id: channelId, page_index: 0 })
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page_index: 0 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, pageOneBased: number) => {
    void loadData({ ...filter, page_index: Math.max(pageOneBased - 1, 0) })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const totalPages = Math.max(response.total_pages, 1)
    const pageOneBased = Math.min(Math.max(Number(event.target.value) || 1, 1), totalPages)

    void loadData({ ...filter, page_index: pageOneBased - 1 })
  }

  const errorText = error?.executionId
    ? `${error.message} ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${error.executionId}`
    : error?.message ?? null

  return {
    filter,
    draftSearchText,
    response,
    rows: response.items,
    totalCount: response.total_count,
    loading,
    error,
    errorText,
    loadData,
    handleSearchTextChange,
    handleSearch,
    handleRefresh,
    handleChannelChange,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
