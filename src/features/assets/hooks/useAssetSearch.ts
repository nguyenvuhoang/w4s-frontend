import type { SelectChangeEvent } from '@mui/material/Select'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import { assetText, emptyAssetFilter } from '../components/assetHelpers'
import { assetService } from '../services/assetService'
import type {
  AssetDictionary,
  AssetFilterModel,
  AssetItem,
  AssetSearchResponse
} from '../types'
import { AssetWorkflowError } from '../types'

type Params = {
  dictionary: AssetDictionary
  sessiontoken?: string
  language?: any
  initialFilter: AssetFilterModel
  initialData: AssetSearchResponse
  initialError?: string | null
  initialErrorReference?: string | null
  initialScope?: string | null
}

export function useAssetSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null,
  initialErrorReference = null,
  initialScope = null
}: Params) {
  const router = useRouter()
  const pathname = usePathname()
  const workingProject = useWorkingProject()
  const hasResolvedInitialProject = useRef(false)
  const requestIdRef = useRef(0)
  const draftFilterRef = useRef(initialFilter)

  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<AssetItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [errorReference, setErrorReference] = useState<string | null>(initialErrorReference)

  const syncUrl = useCallback((nextFilter: AssetFilterModel) => {
    const searchParams = new URLSearchParams({
      project_id: String(nextFilter.project_id),
      search_text: nextFilter.search_text,
      category: nextFilter.category,
      status: nextFilter.status,
      page_index: String(nextFilter.page_index),
      page_size: String(nextFilter.page_size)
    })
    const query = searchParams.toString()

    window.history.replaceState(window.history.state, '', query ? `${pathname}?${query}` : pathname)
  }, [pathname])

  const loadData = useCallback(async (nextFilter: AssetFilterModel = filter) => {
    const requestId = ++requestIdRef.current

    setLoading(true)
    setError(null)
    setErrorReference(null)
    syncUrl(nextFilter)

    try {
      const response = await assetService.simpleSearchAssets({
        sessiontoken,
        language,
        filter: nextFilter
      })

      const resolvedFilter = {
        ...nextFilter,
        page_index: response.page_index,
        page_size: response.page_size
      }

      if (requestId === requestIdRef.current) {
        draftFilterRef.current = resolvedFilter
        setRows(response.items)
        setTotalCount(response.total_count)
        setTotalPages(response.total_pages)
        setFilter(resolvedFilter)
        setDraftFilter(resolvedFilter)
      }

      return response
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : assetText(dictionary, 'load_failed', 'Unable to load assets.'))
        setErrorReference(err instanceof AssetWorkflowError ? err.execution_id ?? null : null)
      }

      return undefined
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken, syncUrl])

  useEffect(() => {
    if (!workingProject) return

    // The server has already loaded the filter under the selected project's scope. When a
    // legacy localStorage selection is first migrated into the server-readable cookie, refresh
    // the route to let SSR perform the one authoritative initial request instead of calling it
    // directly in the client.
    if (!hasResolvedInitialProject.current) {
      hasResolvedInitialProject.current = true

      if (workingProject.code !== initialScope) router.refresh()

      return
    }

    if (filter.project_id === workingProject.id) return

    void loadData({ ...draftFilterRef.current, project_id: workingProject.id, page_index: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof AssetFilterModel>(key: K, value: AssetFilterModel[K]) => {
    const nextFilter = { ...draftFilterRef.current, [key]: value }

    draftFilterRef.current = nextFilter
    setDraftFilter(nextFilter)
  }

  const applyFilter = (patch: Partial<Pick<AssetFilterModel, 'category' | 'status'>>) => {
    // The UI uses one-based pages. assetService converts this to the workflow's zero-based
    // page_index, so a reset to UI page 1 is sent to the backend as page_index: 0.
    const nextFilter = {
      ...draftFilterRef.current,
      ...patch,
      page_index: 1
    }

    draftFilterRef.current = nextFilter
    setDraftFilter(nextFilter)
    void loadData(nextFilter)
  }

  const handleCategoryChange = (category: string) => applyFilter({ category })
  const handleStatusChange = (status: string) => applyFilter({ status })

  const handleSearch = () => {
    void loadData({ ...draftFilterRef.current, page_index: 1 })
  }

  const handleReset = () => {
    const nextFilter = {
      ...emptyAssetFilter,
      project_id: draftFilterRef.current.project_id || emptyAssetFilter.project_id,
      page_index: 1
    }

    draftFilterRef.current = nextFilter
    setDraftFilter(nextFilter)
    void loadData(nextFilter)
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = Number(event.target.value)

    void loadData({ ...filter, page_size, page_index: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
    void loadData({ ...filter, page_index })
  }

  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index })
  }

  return {
    filter,
    draftFilter,
    rows,
    totalCount,
    loading,
    error,
    errorReference,
    loadData,
    updateDraftFilter,
    handleCategoryChange,
    handleStatusChange,
    handleSearch,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
