import type { SelectChangeEvent } from '@mui/material/Select'
import { usePathname } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { WorkflowError } from '@/shared/utils/workflowError'

import { buildMenuCommandQueryString, commonText, menuManagementText } from '../components/menuCommandHelpers'
import { menuCommandService } from '../services/menuCommandService'
import type { MenuCommandFilterModel, MenuCommandItem, MenuCommandSearchResponse, MenuManagementDictionary } from '../types'

export type MenuCommandTypeFilter = 'all' | 'M' | 'C'

type Params = {
  dictionary: MenuManagementDictionary
  sessiontoken?: string
  language: Locale
  initialFilter: MenuCommandFilterModel
  initialData: MenuCommandSearchResponse
  initialError?: string | null
}

export const useMenuCommandSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) => {
  const router = useRouter()
  const pathname = usePathname()
  const [filter, setFilter] = useState(initialFilter)
  const [draftSearchText, setDraftSearchText] = useState(initialFilter.search_text)
  const [rows, setRows] = useState<MenuCommandItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [typeFilter, setTypeFilter] = useState<MenuCommandTypeFilter>('all')

  // Keeps the list's search/page state in the URL (query params) so that navigating to a row's
  // detail page and pressing Back returns to the same search_text/page/page_size instead of
  // resetting to page 1 — same syncUrl-on-load pattern as useFeeInvoiceSearch.
  const syncUrl = useCallback((nextFilter: MenuCommandFilterModel) => {
    const query = buildMenuCommandQueryString(nextFilter)

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router])

  const loadData = async (nextFilter: MenuCommandFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await menuCommandService.searchUserCommands({ sessiontoken, language, filter: nextFilter })
      // The service maps the workflow's zero-based page_index back to the UI's
      // one-based page number. Use it in case the backend normalizes the request.
      const resolvedFilter = { ...nextFilter, page_index: response.page_index, page_size: response.page_size }

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftSearchText(resolvedFilter.search_text)
      syncUrl(resolvedFilter)

      return response
    } catch (caught) {
      const message = caught instanceof Error
        ? caught.message
        : menuManagementText(dictionary, 'load_failed', 'Unable to load menu list.')
      const executionId = caught instanceof WorkflowError ? caught.executionId : undefined

      setError(executionId
        ? `${message} — ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${executionId}`
        : message)

      return undefined
    } finally {
      setLoading(false)
    }
  }

  const updateDraftSearchText = (value: string) => setDraftSearchText(value)

  // Enter must trigger the same search as clicking the Search button, and every new search
  // resets back to the first page.
  const handleSearch = () => void loadData({ ...filter, search_text: draftSearchText, page_index: 1 })

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  const handleRefresh = () => void loadData(filter)

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, pageIndex: number) => {
    void loadData({ ...filter, page_index: pageIndex })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const pageIndex = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index: pageIndex })
  }

  // Backend workflow has no command_type filter param — filtering here only narrows the
  // already-loaded page instead of sending an unsupported field to the server.
  const filteredRows = useMemo(
    () => (typeFilter === 'all' ? rows : rows.filter(row => row.command_type === typeFilter)),
    [rows, typeFilter]
  )

  return {
    filter,
    draftSearchText,
    rows,
    filteredRows,
    typeFilter,
    setTypeFilter,
    totalCount,
    totalPages,
    loading,
    error,
    loadData,
    updateDraftSearchText,
    handleSearch,
    handleSearchKeyDown,
    handleRefresh,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
