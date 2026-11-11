'use client'

import { useCallback, useRef, useState } from 'react'

import type { SelectChangeEvent } from '@mui/material/Select'

import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'

import {
  emptyFeeTemplateFilter,
  FEE_TEMPLATE_SEARCH_WORKFLOW_ID,
  feeTemplateService,
  type FeeTemplateFilter,
  type FeeTemplateItem,
  type FeeTemplateSearchResult
} from '../feeTemplate.service'

type Params = {
  sessiontoken?: string
  language?: any
  initialFilter: FeeTemplateFilter
  initialData: FeeTemplateSearchResult
  initialError?: WorkflowErrorDetail | null
  loadFailedMessage: string
}

/**
 * Notification template list (WF_BO_SIMPLE_SEARCH_NOTIFICATION_TEMPLATES, group FEE).
 * Same model as the fee period list: `filter` holds the applied conditions, `searchInput` the text
 * being typed; the channel select applies at once, the search box on Enter / Search, each action
 * calls the workflow exactly once and a request id guard drops out-of-order responses.
 */
export function useFeeTemplateSearch({
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null,
  loadFailedMessage
}: Params) {
  const requestIdRef = useRef(0)
  const [filter, setFilter] = useState(initialFilter)
  const [searchInput, setSearchInput] = useState(initialFilter.search_text)
  const [rows, setRows] = useState<FeeTemplateItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<WorkflowErrorDetail | null>(initialError)

  const loadData = useCallback(async (nextFilter: FeeTemplateFilter) => {
    const requestId = ++requestIdRef.current

    setError(null)
    setFilter(nextFilter)
    setLoading(true)

    try {
      const result = await feeTemplateService.search({ sessiontoken, language, filter: nextFilter })

      if (requestId !== requestIdRef.current) return

      setRows(result.items)
      setTotalCount(result.total_count)
      setFilter({ ...nextFilter, page_index: result.page_index, page_size: result.page_size })
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return

      setRows([])
      setTotalCount(0)
      setError(normalizeWorkflowErrorDetail(loadError, { fallback: loadFailedMessage, workflowId: FEE_TEMPLATE_SEARCH_WORKFLOW_ID }))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [language, loadFailedMessage, sessiontoken])

  return {
    filter,
    searchInput,
    setSearchInput,
    rows,
    totalCount,
    loading,
    error,
    reload: () => loadData(filter),
    handleChannelChange: (channel: string) => void loadData({ ...filter, channel, page_index: 1 }),
    handleSearch: () => void loadData({ ...filter, search_text: searchInput.trim(), page_index: 1 }),
    handleReset: () => {
      setSearchInput('')
      void loadData({ ...emptyFeeTemplateFilter, page_size: filter.page_size })
    },
    handlePageChange: (_event: unknown, page: number) => void loadData({ ...filter, page_index: page }),
    handlePageSizeChange: (event: SelectChangeEvent<number>) => void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 }),
    handleJumpPage: (event: any) => {
      const totalPages = filter.page_size > 0 ? Math.max(Math.ceil(totalCount / filter.page_size), 1) : 1
      const page = Math.min(Math.max(Number(event?.target?.value) || 1, 1), totalPages)

      void loadData({ ...filter, page_index: page })
    }
  }
}
