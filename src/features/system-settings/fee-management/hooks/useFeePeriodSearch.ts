'use client'

import { useCallback, useRef, useState } from 'react'

import type { SelectChangeEvent } from '@mui/material/Select'

import { FEE_PERIODS_SEARCH_WORKFLOW_ID, feeService } from '@/features/fees/service'
import type { FeePeriodFilterModel, FeePeriodItem, FeePeriodSearchResponse } from '@/features/fees/types'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'

import { emptyFeePeriodFilter } from '../feePeriod.helpers'

type Params = {
  sessiontoken?: string
  language?: any
  initialFilter: FeePeriodFilterModel
  initialData: FeePeriodSearchResponse
  initialError?: WorkflowErrorDetail | null
  loadFailedMessage: string
}

export type FeePeriodSelectFilterKey = 'project_id' | 'year' | 'month' | 'status'

/**
 * Fee period list (WF_BO_ADVANCED_SEARCH_FEE_PERIOD) across projects. System Settings does not follow
 * the global working project: "All projects" omits project_id; it is only sent when the user picks one.
 *
 * `filter` is the single source of the applied conditions (including the applied search_text);
 * `searchInput` is only the text being typed. Each user action calls loadData exactly once (no
 * effect-driven fetch): selects apply immediately with the applied search text, the search box
 * applies on Enter / Search, and paging keeps the applied filter. UI page_index is one-based
 * (the service sends page_index - 1). A request id guard drops out-of-order responses.
 */
export function useFeePeriodSearch({
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
  const [rows, setRows] = useState<FeePeriodItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<WorkflowErrorDetail | null>(initialError)

  const loadData = useCallback(async (nextFilter: FeePeriodFilterModel) => {
    const requestId = ++requestIdRef.current

    setError(null)
    setFilter(nextFilter)
    setLoading(true)

    try {
      const response = await feeService.searchFeePeriods({
        sessiontoken,
        language,
        filter: nextFilter
      })

      if (requestId !== requestIdRef.current) return

      setRows(response.items)
      setTotalCount(response.total_count)
      setFilter({ ...nextFilter, page_index: response.page_index, page_size: response.page_size })
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return

      setRows([])
      setTotalCount(0)
      setError(normalizeWorkflowErrorDetail(loadError, {
        fallback: loadFailedMessage,
        workflowId: FEE_PERIODS_SEARCH_WORKFLOW_ID
      }))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [language, loadFailedMessage, sessiontoken])

  /** Select change: apply at once, back to page 1, keep the other applied conditions. */
  const handleFilterChange = (key: FeePeriodSelectFilterKey, value: number | string | null) => {
    void loadData({ ...filter, [key]: value, page_index: 1 })
  }

  /** Enter / Search: apply the typed text together with the applied select filters. */
  const handleSearch = () => {
    void loadData({ ...filter, search_text: searchInput.trim(), page_index: 1 })
  }

  /** Back to the defaults ("All" everywhere, empty search, page 1); page size is kept. */
  const handleReset = () => {
    setSearchInput('')
    void loadData({ ...emptyFeePeriodFilter, page_size: filter.page_size })
  }

  const handlePageChange = (_event: unknown, page: number) => {
    void loadData({ ...filter, page_index: page })
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
  }

  const handleJumpPage = (event: any) => {
    const totalPages = filter.page_size > 0 ? Math.max(Math.ceil(totalCount / filter.page_size), 1) : 1
    const page = Math.min(Math.max(Number(event?.target?.value) || 1, 1), totalPages)

    void loadData({ ...filter, page_index: page })
  }

  return {
    filter,
    searchInput,
    setSearchInput,
    rows,
    totalCount,
    loading,
    error,
    reload: () => loadData(filter),
    handleFilterChange,
    handleSearch,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleJumpPage
  }
}
