'use client'

import type { SelectChangeEvent } from '@mui/material/Select'
import { useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { bankHubService, toBankHubCompanySearchError } from '../bankhub/bankhub.service'
import type {
  BankHubCompany,
  BankHubCompanyFilter,
  BankHubCompanySearchError,
  BankHubCompanySearchResult
} from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'

type Params = {
  dictionary: SystemSettingsDictionary
  sessiontoken?: string
  language: Locale
  initialFilter: BankHubCompanyFilter
  initialData: BankHubCompanySearchResult
  initialError?: BankHubCompanySearchError | null
}

export const useBankHubCompanySearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) => {
  const [filter, setFilter] = useState(initialFilter)
  const [searchText, setSearchText] = useState(initialFilter.search_text)
  const [rows, setRows] = useState<BankHubCompany[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<BankHubCompanySearchError | null>(initialError)

  // Ignores responses of superseded requests (e.g. fast page clicks) so the table never shows stale rows.
  const requestIdRef = useRef(0)

  const loadData = async (nextFilter: BankHubCompanyFilter = filter) => {
    const requestId = ++requestIdRef.current
    const fallback = integrationsText(dictionary, 'bankhub_companies_load_failed')

    setLoading(true)
    setError(null)
    // Keep the requested UI page (1-based) instead of the backend's 0-based echo of page_index.
    setFilter(nextFilter)

    try {
      const response = await bankHubService.searchCompanies({
        sessiontoken,
        language,
        filter: nextFilter,
        fallbackMessage: fallback
      })

      if (requestId !== requestIdRef.current) return

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter({ ...nextFilter, page_size: response.page_size })
    } catch (caught) {
      if (requestId !== requestIdRef.current) return

      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setError(toBankHubCompanySearchError(caught, fallback))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  const handleSearch = () => {
    const trimmed = searchText.trim()

    setSearchText(trimmed)
    void loadData({ ...filter, search_text: trimmed, page: 1 })
  }

  const handleReset = () => {
    setSearchText('')
    void loadData({ search_text: '', page: 1, page_size: filter.page_size })
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    void loadData({ ...filter, page })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page })
  }

  return {
    filter,
    searchText,
    setSearchText,
    rows,
    totalCount,
    loading,
    error,
    loadData,
    handleSearch,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
