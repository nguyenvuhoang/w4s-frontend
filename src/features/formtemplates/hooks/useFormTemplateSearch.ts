import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { formTemplateService } from '../formTemplateService'
import { emptyFormTemplateFilter, formTemplateText } from '../formTemplateHelpers'
import type {
  FormTemplateDictionary,
  FormTemplateSearchFilter,
  FormTemplateSearchResponse
} from '../types'

type Params = {
  dictionary: FormTemplateDictionary
  sessiontoken?: string
  language: any
  initialFilter: FormTemplateSearchFilter
  initialData: FormTemplateSearchResponse
  initialError?: string | null
}

export const useFormTemplateSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialError = null
}: Params) => {
  const workingProject = useWorkingProject()
  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const loadData = useCallback(async (nextFilter: FormTemplateSearchFilter = filter) => {
    if (!nextFilter.project_id) {
      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setFilter(nextFilter)
      setDraftFilter(nextFilter)
      setError(null)

      return undefined
    }

    setLoading(true)
    setError(null)

    try {
      const response = await formTemplateService.simpleSearchFormTemplates({
        sessiontoken,
        language,
        filter: nextFilter
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
      setRows([])
      setTotalCount(0)
      setTotalPages(0)
      setError(caught instanceof Error ? caught.message : formTemplateText(dictionary, 'loadFormTemplatesFailed', 'Không thể tải danh sách biểu mẫu.'))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  useEffect(() => {
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    void loadData({ ...draftFilter, project_id: workingProject.id, page_index: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof FormTemplateSearchFilter>(key: K, value: FormTemplateSearchFilter[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })

  const handleReset = () => void loadData({
    ...emptyFormTemplateFilter,
    project_id: filter.project_id,
    page_size: draftFilter.page_size
  })

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
    selectedProject: workingProject,
    loadData,
    updateDraftFilter,
    handleSearch,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
