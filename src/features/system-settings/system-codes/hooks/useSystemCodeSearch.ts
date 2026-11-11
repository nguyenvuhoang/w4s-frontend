import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { commonText, emptySystemCodeFilter, systemCodeText } from '../components/systemCodeHelpers'
import { systemCodeService } from '../services/systemCodeService'
import type { SystemCodeFilterModel, SystemCodeSearchResponse, SystemCodesDictionary } from '../types'
import { SystemCodeApiError } from '../types'

type Params = {
  dictionary: SystemCodesDictionary
  language: Locale
  initialFilter?: SystemCodeFilterModel
  initialData?: SystemCodeSearchResponse
}

const DEBOUNCE_MS = 450

export const useSystemCodeSearch = ({
  dictionary,
  language,
  initialFilter = emptySystemCodeFilter,
  initialData = systemCodeService.getDefaultSearchResponse(initialFilter)
}: Params) => {
  const router = useRouter()
  const searchVersionRef = useRef(0)
  const hasMountedRef = useRef(false)
  const filterRef = useRef<SystemCodeFilterModel>(initialFilter)
  const [filter, setFilter] = useState<SystemCodeFilterModel>(initialFilter)
  const [draftSearchText, setDraftSearchText] = useState(initialFilter.search_text)
  const [response, setResponse] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; executionId?: string } | null>(null)

  const formatError = useCallback((caught: unknown) => {
    if (caught instanceof SystemCodeApiError && caught.nextAction === 'logout') {
      router.push(`/${language}/logout`)
    }

    const message = caught instanceof Error
      ? caught.message
      : systemCodeText(dictionary, 'load_failed', 'Unable to load system codes.')
    const executionId = caught instanceof SystemCodeApiError ? caught.executionId : undefined

    return { message, executionId }
  }, [dictionary, language, router])

  const loadData = useCallback(async (nextFilter: SystemCodeFilterModel) => {
    const requestVersion = ++searchVersionRef.current

    setLoading(true)
    setError(null)

    try {
      const result = await systemCodeService.searchSystemCodes({ language, filter: nextFilter })

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
  }, [initialFilter, loadData])

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
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
