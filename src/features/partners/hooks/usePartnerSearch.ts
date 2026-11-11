import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useState } from 'react'

import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { emptyPartnerFilter, partnerText } from '../partnerHelpers'
import { partnerService } from '../service'
import type { PartnerDictionary, PartnerFilterModel, PartnerItem, PartnerSearchResponse, PartnerWorkflowError } from '../types'

type Params = {
  dictionary: PartnerDictionary
  sessiontoken?: string
  language?: Parameters<typeof partnerService.simpleSearchPartners>[0]['language']
  initialFilter: PartnerFilterModel
  initialData: PartnerSearchResponse
  initialError?: PartnerWorkflowError | null
}

export function usePartnerSearch({ dictionary, sessiontoken, language, initialFilter, initialData, initialError = null }: Params) {
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState<PartnerItem[]>(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PartnerWorkflowError | null>(initialError)

  const loadData = useCallback(async (nextFilter: PartnerFilterModel) => {
    setLoading(true)
    setError(null)

    try {
      const response = await partnerService.simpleSearchPartners({ sessiontoken, language, filter: nextFilter })
      const resolvedFilter = { ...nextFilter, page_index: response.page_index, page_size: nextFilter.page_size }

      setRows(response.items)
      setTotalCount(response.total_count)
      setTotalPages(response.total_pages)
      setFilter(resolvedFilter)
      setDraftFilter(resolvedFilter)
    } catch (caught) {
      const detail = normalizeWorkflowErrorDetail(caught, {
        fallback: partnerText(dictionary, 'load_failed', 'Unable to load partners.')
      })

      setError({ message: detail.message, executionId: detail.executionId })
    } finally {
      setLoading(false)
    }
  }, [dictionary, language, sessiontoken])

  const updateDraftFilter = (key: 'search_text', value: string) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })
  const handleReset = () => void loadData(emptyPartnerFilter)
  const handleRefresh = () => void loadData(filter)
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page_index: number) => void loadData({ ...filter, page_index })
  const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1))

    void loadData({ ...filter, page_index })
  }

  return { filter, draftFilter, rows, totalCount, totalPages, loading, error, updateDraftFilter, handleSearch, handleReset, handleRefresh, handlePageSizeChange, handlePageChange, handleJumpPage }
}
