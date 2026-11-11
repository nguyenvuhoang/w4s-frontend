import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import {
  applicationLogText,
  buildApplicationLogSummary,
  emptyApplicationLogFilter,
  findFirstErrorLogId,
  sortApplicationLogsByTimestampAsc
} from '../components/applicationLogHelpers'
import { applicationLogService } from '../services/applicationLogService'
import type { ApplicationLogFilterModel } from '../types'
import { ApplicationLogWorkflowError } from '../types'

type Params = {
  language: Locale
  initialExecutionId?: string
}

export const useApplicationLogSearch = ({ language, initialExecutionId }: Params) => {
  const router = useRouter()
  const normalizedInitialExecutionId = initialExecutionId?.trim() ?? ''
  const initialFilter = useMemo<ApplicationLogFilterModel>(() => ({
    ...emptyApplicationLogFilter,
    correlation_id: normalizedInitialExecutionId
  }), [normalizedInitialExecutionId])
  const [filter, setFilter] = useState<ApplicationLogFilterModel>(initialFilter)
  const [draftFilter, setDraftFilter] = useState<ApplicationLogFilterModel>(initialFilter)
  const [response, setResponse] = useState(applicationLogService.getDefaultSearchResponse())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const initialTraceTriggered = useRef(false)

  const handleWorkflowError = useCallback((caught: unknown, fallback: string) => {
    if (caught instanceof ApplicationLogWorkflowError && caught.next_action === 'logout') {
      router.push(`/${language}/logout`)
    }

    return caught instanceof Error ? caught.message : fallback
  }, [language, router])

  const loadData = useCallback(async (nextFilter: ApplicationLogFilterModel) => {
    setLoading(true)
    setError(null)

    try {
      const result = await applicationLogService.searchApplicationLogs({ language, filter: nextFilter })
      const resolvedFilter = {
        ...nextFilter,
        page_index: result.page_index,
        page_size: result.page_size
      }

      setResponse(result)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)
      setHasSearched(true)

      return result
    } catch (caught) {
      setError(handleWorkflowError(
        caught,
        applicationLogText(language, 'Không thể tải nhật ký lỗi ứng dụng.', 'Unable to load application logs.')
      ))
      setHasSearched(true)

      return undefined
    } finally {
      setLoading(false)
    }
  }, [handleWorkflowError, language])

  useEffect(() => {
    if (!normalizedInitialExecutionId || initialTraceTriggered.current) return

    initialTraceTriggered.current = true
    void loadData({ ...emptyApplicationLogFilter, correlation_id: normalizedInitialExecutionId })
  }, [loadData, normalizedInitialExecutionId])

  const updateDraftFilter = <K extends keyof ApplicationLogFilterModel>(key: K, value: ApplicationLogFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 0 })
  const handleReset = () => {
    setDraftFilter(emptyApplicationLogFilter)
    void loadData(emptyApplicationLogFilter)
  }
  const handleRefresh = () => void loadData(filter)

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

  const summary = useMemo(() => buildApplicationLogSummary(response), [response])
  const timelineItems = useMemo(() => sortApplicationLogsByTimestampAsc(response.items), [response.items])
  const firstErrorLogId = useMemo(() => findFirstErrorLogId(response.items), [response.items])

  return {
    filter,
    draftFilter,
    response,
    items: response.items,
    timelineItems,
    summary,
    firstErrorLogId,
    totalCount: response.total_count,
    totalPages: response.total_pages,
    loading,
    error,
    hasSearched,
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
