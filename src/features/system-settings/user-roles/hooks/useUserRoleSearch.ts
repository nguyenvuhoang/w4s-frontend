import type { SelectChangeEvent } from '@mui/material/Select'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { emptyUserRoleFilter, userRoleText } from '../components/userRoleHelpers'
import { userRoleService } from '../services/userRoleService'
import type { UserRoleFilterModel, UserRoleItem, UserRoleSearchResponse, UserRolesDictionary } from '../types'

type Params = {
  dictionary: UserRolesDictionary
  sessiontoken?: string
  language: Locale
  initialFilter: UserRoleFilterModel
  initialData: UserRoleSearchResponse
  initialError?: string | null
}

export const useUserRoleSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) => {
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<UserRoleItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const loadData = async (nextFilter: UserRoleFilterModel = filter) => {
    setLoading(true)
    setError(null)

    try {
      const response = await userRoleService.searchUserRoles({
        sessiontoken,
        language,
        filter: {
          ...nextFilter,
          channel_code: 'BO'
        }
      })
      // Intentionally keep page_index from nextFilter (the page the user actually requested),
      // not response.page_index: the server echoes back its own 0-based page convention, and
      // mapping that back to the UI's 1-based page number is unreliable — see PROJECT pagination
      // convention (page_index = currentPage - 1). Trusting it here previously left the
      // pagination control stuck one page behind after every click.
      const resolvedFilter = {
        ...nextFilter,
        channel_code: 'BO' as const,
        page_size: response.page_size
      }

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)

      return response
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : userRoleText(dictionary, 'load_failed', 'Unable to load user roles.'))

      return undefined
    } finally {
      setLoading(false)
    }
  }

  const updateDraftFilter = <K extends keyof UserRoleFilterModel>(key: K, value: UserRoleFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1, channel_code: 'BO' })
  }

  const handleReset = () => {
    void loadData({ ...emptyUserRoleFilter, page_size: filter.page_size })
  }

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
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
