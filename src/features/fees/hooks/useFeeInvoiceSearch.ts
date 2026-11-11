import type { SelectChangeEvent } from '@mui/material/Select'
import { usePathname } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'

import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { emptyFeeInvoiceFilter, feeText } from '../components/feeInvoiceHelpers'
import { feeService } from '../service'
import type {
  FeeInvoiceFilterModel,
  FeeInvoiceItem,
  FeeInvoiceSearchResponse,
  FeeApartmentGroup,
  FeeDictionary,
  FeeWorkflowError
} from '../types'

type Params = {
  dictionary: FeeDictionary
  sessiontoken?: string
  language?: any
  initialFilter: FeeInvoiceFilterModel
  initialData: FeeInvoiceSearchResponse
  initialError?: FeeWorkflowError | null
  scope?: string | null
  viewMode?: 'list' | 'apartment'
}

const FEE_INVOICE_PAGE_SIZES = [5, 10, 20, 50] as const
const normalizePageSize = (value: number, fallback = 10) => FEE_INVOICE_PAGE_SIZES.includes(value as typeof FEE_INVOICE_PAGE_SIZES[number]) ? value : fallback

export function useFeeInvoiceSearch({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null,
  scope,
  viewMode = 'list'
}: Params) {
  const router = useRouter()
  const pathname = usePathname()
  const hydratedFilter = { ...initialFilter, page_index: initialData.page_index || 1, page_size: normalizePageSize(initialData.page_size || initialFilter.page_size, normalizePageSize(initialFilter.page_size)) }
  const [filter, setFilter] = useState(hydratedFilter)
  const [draftFilter, setDraftFilter] = useState(hydratedFilter)
  const [rows, setRows] = useState<FeeInvoiceItem[]>(initialData.items)
  const [apartmentGroups, setApartmentGroups] = useState<FeeApartmentGroup[]>([])
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<FeeWorkflowError | null>(initialError)
  const requestIdRef = useRef(0)

  const syncUrl = useCallback((nextFilter: FeeInvoiceFilterModel) => {
    const params = new URLSearchParams()

    if (nextFilter.search_text.trim()) params.set('search_text', nextFilter.search_text.trim())
    if (nextFilter.project_id && nextFilter.project_id > 0) params.set('project_id', String(nextFilter.project_id))
    if (nextFilter.fee_period_id) params.set('fee_period_id', String(nextFilter.fee_period_id))
    if (nextFilter.fee_type_id) params.set('fee_type_id', String(nextFilter.fee_type_id))
    if (nextFilter.status) params.set('status', nextFilter.status)
    if (nextFilter.page_index > 1) params.set('page_index', String(nextFilter.page_index))
    if (nextFilter.page_size !== emptyFeeInvoiceFilter.page_size) params.set('page_size', String(nextFilter.page_size))

    const query = params.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router])

  const loadData = useCallback(async (nextFilter: FeeInvoiceFilterModel = filter) => {
    if (!scope) return undefined
    const hasAdvancedFilters = Boolean(nextFilter.fee_period_id || nextFilter.fee_type_id || nextFilter.status)
    if (viewMode === 'list' && hasAdvancedFilters && nextFilter.search_text.trim()) {
      setError({ message: feeText(dictionary, 'fee_invoice_advanced_search_text_unsupported', 'Search text cannot be combined with fee period, fee type, or payment status until the backend supports it.') })
      return undefined
    }
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    try {
      const response = viewMode === 'apartment'
        ? await feeService.searchFeeInvoicesByApartment({ sessiontoken, language, filter: nextFilter, scope })
        : await (hasAdvancedFilters ? feeService.advancedSearchFeeInvoices : feeService.simpleSearchFeeInvoices)({ sessiontoken, language, filter: nextFilter, scope })
      if (requestId !== requestIdRef.current) return undefined

      const resolvedFilter = {
        ...nextFilter,
        page_index: response.page_index,
        page_size: normalizePageSize(response.page_size, nextFilter.page_size)
      }

      if (viewMode === 'apartment') setApartmentGroups(response.items as FeeApartmentGroup[])
      else setRows(response.items as FeeInvoiceItem[])
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)
      syncUrl(resolvedFilter)

      return response
    } catch (err) {
      if (requestId !== requestIdRef.current) return undefined
      setError(normalizeWorkflowErrorDetail(err, {
        fallback: feeText(dictionary, 'fee_invoice_load_failed', 'Unable to load fee invoices.')
      }))

      return undefined
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [dictionary, filter, language, scope, sessiontoken, syncUrl, viewMode])

  useEffect(() => {
    setApartmentGroups([])
  }, [viewMode])

  const updateDraftFilter = <K extends keyof FeeInvoiceFilterModel>(key: K, value: FeeInvoiceFilterModel[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const applyAdvancedFilter = <K extends 'fee_period_id' | 'fee_type_id' | 'status'>(key: K, value: FeeInvoiceFilterModel[K]) => {
    const next = { ...draftFilter, [key]: value, page_index: 1 }
    setDraftFilter(next)
    void loadData(next)
  }

  const handleSearch = () => {
    void loadData({ ...draftFilter, page_index: 1 })
  }

  const handleReset = (feePeriodId: number | null = null) => {
    void loadData({ ...emptyFeeInvoiceFilter, project_id: filter.project_id, fee_period_id: feePeriodId, page_index: 1 })
  }

  const handleRefresh = () => {
    void loadData(filter)
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const page_size = normalizePageSize(Number(event.target.value), filter.page_size)

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
    apartmentGroups,
    totalCount,
    loading,
    error,
    loadData,
    updateDraftFilter,
    applyAdvancedFilter,
    handleSearch,
    handleReset,
    handleRefresh,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
