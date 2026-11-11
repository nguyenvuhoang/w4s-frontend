'use client'

import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { useDebouncedValue } from '@/features/announcement/hooks/useDebouncedValue'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE,
  BANKHUB_TRANSACTION_SEARCH_DEBOUNCE_MS
} from '../bankhub/bankhub.constants'
import {
  bankHubService,
  getDefaultBankHubTransactionFilter,
  toBankHubTransactionSearchError
} from '../bankhub/bankhub.service'
import type {
  BankHubCompanySearchError,
  BankHubTransaction,
  BankHubTransactionFilter,
  BankHubTransactionSearchResult
} from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'

type Params = {
  dictionary: SystemSettingsDictionary
  sessiontoken?: string
  language: Locale
  companyXid: string
  provider?: string | null
  /** First page (page_index = 0, no filter) loaded by the server page. */
  initialData: BankHubTransactionSearchResult
  initialError?: BankHubCompanySearchError | null
}

/** Toolbar filter fields (search text and paging are handled separately). */
export type BankHubTransactionFilterField = Exclude<keyof BankHubTransactionFilter, 'page' | 'page_size' | 'search_text'>

/** Bank Hub transactions of the company being viewed (WF_BO_GET_BANK_HUB_TRANSACTIONS) with server-side search/filter/paging. */
export const useBankHubCompanyTransactions = ({
  dictionary,
  sessiontoken,
  language,
  companyXid,
  provider,
  initialData,
  initialError = null
}: Params) => {
  const initialPageSize = initialData.page_size || BANKHUB_TRANSACTION_DEFAULT_PAGE_SIZE

  const [filter, setFilter] = useState<BankHubTransactionFilter>(
    () => getDefaultBankHubTransactionFilter(initialPageSize)
  )

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, BANKHUB_TRANSACTION_SEARCH_DEBOUNCE_MS)

  const [rows, setRows] = useState<BankHubTransaction[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<BankHubCompanySearchError | null>(initialError)

  // router.refresh() re-runs the server page with new props: adopt them (React "adjust state on prop change").
  const [syncedInitial, setSyncedInitial] = useState({ initialData, initialError })

  if (syncedInitial.initialData !== initialData || syncedInitial.initialError !== initialError) {
    setSyncedInitial({ initialData, initialError })
    setRows(initialData.items)
    setTotalCount(initialData.total_count)
    setTotalPages(initialData.total_pages)
    setError(initialError)
    setFilter(getDefaultBankHubTransactionFilter(initialPageSize))
    setSearchInput('')
  }

  // Ignores responses of superseded requests (fast typing/page clicks) so the table never shows stale rows.
  const requestIdRef = useRef(0)

  const loadData = useCallback(async (nextFilter: BankHubTransactionFilter) => {
    const requestId = ++requestIdRef.current
    const fallback = integrationsText(dictionary, 'bankhub_transaction_load_failed')

    setLoading(true)
    setError(null)
    setFilter(nextFilter)

    try {
      const response = await bankHubService.searchTransactions({
        sessiontoken,
        language,
        companyXid,
        provider,
        filter: nextFilter,
        fallbackMessage: fallback
      })

      if (requestId !== requestIdRef.current) return

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter({ ...nextFilter, page_size: response.page_size || nextFilter.page_size })
    } catch (caught) {
      if (requestId !== requestIdRef.current) return

      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setError(toBankHubTransactionSearchError(caught, fallback))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [companyXid, dictionary, language, provider, sessiontoken])

  // Debounced search text goes to the workflow (`search_text`), back to the first page; never filtered client-side.
  // Waits until the debounced value has settled on the input so a reset is not overridden by a stale value.
  useEffect(() => {
    const searchText = debouncedSearch.trim()

    if (debouncedSearch !== searchInput || searchText === filter.search_text) return

    void loadData({ ...filter, search_text: searchText, page: 1 })
  }, [debouncedSearch, filter, loadData, searchInput])

  const reload = () => void loadData(filter)

  const handleFilterChange = (field: BankHubTransactionFilterField, value: string) => {
    void loadData({ ...filter, [field]: value, page: 1 } as BankHubTransactionFilter)
  }

  const resetFilters = () => {
    setSearchInput('')
    void loadData(getDefaultBankHubTransactionFilter(filter.page_size))
  }

  const hasActiveFilters = Boolean(
    searchInput.trim()
      || filter.search_text
      || filter.bank_account_xid
      || filter.brand_name
      || filter.start_transaction_date
      || filter.end_transaction_date
      || filter.transfer_type
      || filter.webhook_success
  )

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page: 1, page_size: Number(event.target.value) })
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
    searchInput,
    setSearchInput,
    rows,
    totalCount,
    loading,
    error,
    hasActiveFilters,
    reload,
    resetFilters,
    handleFilterChange,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
