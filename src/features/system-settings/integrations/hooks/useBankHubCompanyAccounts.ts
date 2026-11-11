'use client'

import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE } from '../bankhub/bankhub.constants'
import { bankHubService, toBankHubAccountSearchError } from '../bankhub/bankhub.service'
import type {
  BankHubAccount,
  BankHubAccountFilter,
  BankHubAccountSearchResult,
  BankHubCompanySearchError
} from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'

type Params = {
  dictionary: SystemSettingsDictionary
  sessiontoken?: string
  language: Locale
  companyXid: string
  provider?: string | null
  /** First page (page_index = 0) loaded by the server page. */
  initialData: BankHubAccountSearchResult
  initialError?: BankHubCompanySearchError | null
}

/** Bank accounts of the company being viewed (WF_BO_GET_BANKHUB_ACCOUNTS) with server-side paging. */
export const useBankHubCompanyAccounts = ({
  dictionary,
  sessiontoken,
  language,
  companyXid,
  provider,
  initialData,
  initialError = null
}: Params) => {
  const [filter, setFilter] = useState<BankHubAccountFilter>({
    page: 1,
    page_size: initialData.page_size || BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE
  })

  const [rows, setRows] = useState<BankHubAccount[]>(initialData.items)
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
    setFilter({ page: 1, page_size: initialData.page_size || BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE })
  }

  // Ignores responses of superseded requests (e.g. fast page clicks) so the table never shows stale rows.
  const requestIdRef = useRef(0)

  const loadData = useCallback(async (nextFilter: BankHubAccountFilter) => {
    const requestId = ++requestIdRef.current
    const fallback = integrationsText(dictionary, 'bankhub_account_load_failed')

    setLoading(true)
    setError(null)
    setFilter(nextFilter)

    try {
      const response = await bankHubService.searchAccounts({
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
      setError(toBankHubAccountSearchError(caught, fallback))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [companyXid, dictionary, language, provider, sessiontoken])

  const reload = () => void loadData(filter)

  /** After linking a new account: back to the first page so the new account is visible. */
  const reloadFirstPage = useCallback(() => {
    void loadData({ page: 1, page_size: filter.page_size })
  }, [filter.page_size, loadData])

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ page: 1, page_size: Number(event.target.value) })
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
    rows,
    totalCount,
    loading,
    error,
    reload,
    reloadFirstPage,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
