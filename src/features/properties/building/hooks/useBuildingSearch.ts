import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import { buildingService } from '../buildingService'
import { buildingText, emptyBuildingFilter, withBuildingStatus } from '../buildingHelpers'
import type {
  BuildingDictionary,
  BuildingSearchFilter,
  BuildingSearchResponse,
  BuildingStatusFilter
} from '../types'

type Params = {
  dictionary: BuildingDictionary
  sessiontoken?: string
  language: any
  initialFilter: BuildingSearchFilter
  initialData: BuildingSearchResponse
  initialError?: string | null
}

export const useBuildingSearch = ({
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
  // True from the first render when the mount effect below is about to load the working project's towers,
  // so the table shows its skeleton instead of a brief "no data" state.
  const [loading, setLoading] = useState(() => Boolean(workingProject) && initialFilter.project_id !== workingProject?.id)
  const [error, setError] = useState<string | null>(initialError)

  const loadData = useCallback(async (nextFilter: BuildingSearchFilter = filter) => {
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
      const response = await buildingService.simpleSearchBuildings({
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
      setError(caught instanceof Error ? caught.message : buildingText(dictionary, 'loadBuildingsFailed', 'Unable to load buildings.'))

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

  const updateDraftFilter = <K extends keyof BuildingSearchFilter>(key: K, value: BuildingSearchFilter[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })

  // Server-side filter: reload from page 1 keeping the typed search text, page size and project.
  const handleStatusChange = (status: BuildingStatusFilter) => void loadData(withBuildingStatus(draftFilter, status))

  const handleReset = () => void loadData({
    ...emptyBuildingFilter,
    project_id: draftFilter.project_id,
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
    handleStatusChange,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
