import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { emptyAuditLogFilter, auditLogText } from '../components/auditLogHelpers'
import { auditLogService } from '../services/auditLogService'
import type { AuditLogFilterModel, AuditLogSearchResponse } from '../types'
import { AuditLogWorkflowError } from '../types'

type Params = {
  sessiontoken?: string
  language: Locale
  initialFilter: AuditLogFilterModel
  initialData: AuditLogSearchResponse
  initialError?: string | null
}

const toRequestFilter = (filter: AuditLogFilterModel) => ({
  pageindex: Math.max(filter.page_index, 0),
  pagesize: filter.page_size,
  workflowid: filter.workflowid.trim(),
  execution_id: filter.execution_id.trim(),
  status: filter.status,
  from_date: filter.from_date || null,
  to_date: filter.to_date || null
})

export const useAuditLogSearch = ({
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) => {
  const router = useRouter()
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const handleWorkflowError = useCallback((caught: unknown, fallback: string) => {
    if (caught instanceof AuditLogWorkflowError && caught.next_action === 'logout') {
      router.push(`/${language}/logout`)
    }

    return caught instanceof Error ? caught.message : fallback
  }, [language, router])

  const loadData = useCallback(async (nextFilter: AuditLogFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await auditLogService.searchAuditLogs({
        sessiontoken,
        language,
        filter: toRequestFilter(nextFilter)
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
    } catch (caught) {
      setError(handleWorkflowError(
        caught,
        auditLogText(language, 'Không thể tải danh sách nhật ký hệ thống.', 'Unable to load audit logs.')
      ))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [filter, handleWorkflowError, language, sessiontoken])

  const updateDraftFilter = <K extends keyof AuditLogFilterModel>(key: K, value: AuditLogFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 0 })
  const handleReset = () => void loadData({ ...emptyAuditLogFilter, page_size: filter.page_size })
  const handleRefresh = () => void loadData(filter)

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page_index: 0 })
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
