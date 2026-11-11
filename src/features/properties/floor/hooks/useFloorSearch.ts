import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import { floorService } from '../floorService'
import { emptyFloorFilter, floorText, resolvePreferredFloorBuildingId, withFloorStatus } from '../floorHelpers'
import type {
  FloorBuildingOption,
  FloorDictionary,
  FloorSearchFilter,
  FloorSearchResponse,
  FloorStatusFilter
} from '../types'

type Params = {
  dictionary: FloorDictionary
  sessiontoken?: string
  language: any
  initialFilter: FloorSearchFilter
  initialData: FloorSearchResponse
  initialBuildings?: FloorBuildingOption[]
  initialBuildingsError?: string | null
  initialError?: string | null
  /**
   * Tower context from the URL (`?project_id=&building_id=`), e.g. when coming back from the Floor detail
   * after Edit/Delete. Restored once, only when it belongs to the working project and is one of its towers.
   */
  preferredContext?: { project_id: number | null; building_id: number | null }
}

export const useFloorSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialBuildings = [],
  initialBuildingsError = null,
  initialError = null,
  preferredContext
}: Params) => {
  const workingProject = useWorkingProject()
  const preferredContextRef = useRef(preferredContext ?? null)

  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [buildingOptions, setBuildingOptions] = useState<FloorBuildingOption[]>(initialBuildings)
  // True from the first render when the mount effect below is about to load the working project's towers.
  const [buildingsLoading, setBuildingsLoading] = useState(() => Boolean(workingProject) && initialFilter.project_id !== workingProject?.id)
  const [buildingsError, setBuildingsError] = useState<string | null>(initialBuildingsError)

  const selectedBuilding = buildingOptions.find(building => building.id === filter.building_id) ?? null

  const loadData = useCallback(async (nextFilter: FloorSearchFilter = filter) => {
    if (!nextFilter.project_id || !nextFilter.building_id) {
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
      const response = await floorService.simpleSearchFloors({
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
      setError(caught instanceof Error ? caught.message : floorText(dictionary, 'loadFloorsFailed', 'Unable to load floors.'))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  const loadBuildingOptions = useCallback(async (projectId: number | null): Promise<FloorBuildingOption[]> => {
    if (!projectId) {
      setBuildingOptions([])

      return []
    }

    setBuildingsLoading(true)
    setBuildingsError(null)

    try {
      const options = await floorService.simpleSearchBuildings({ sessiontoken, language, project_id: projectId })

      setBuildingOptions(options)

      return options
    } catch (caught) {
      setBuildingOptions([])
      setBuildingsError(caught instanceof Error ? caught.message : floorText(dictionary, 'loadBuildingsFailed', 'Unable to load buildings.'))

      return []
    } finally {
      setBuildingsLoading(false)
    }
  }, [dictionary, language, sessiontoken])

  useEffect(() => {
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    const nextFilter: FloorSearchFilter = {
      ...emptyFloorFilter,
      page_size: filter.page_size,
      project_id: workingProject.id,
      building_id: null
    }

    setRows([])
    setTotalCount(0)
    setTotalPages(0)
    setFilter(nextFilter)
    setDraftFilter(nextFilter)
    setError(null)

    const preferred = preferredContextRef.current

    // Consumed on the first working-project load only: a later project switch never jumps back to it.
    preferredContextRef.current = null

    void loadBuildingOptions(workingProject.id).then(options => {
      const restoreBuildingId = resolvePreferredFloorBuildingId(preferred, workingProject.id, options)

      if (restoreBuildingId) void loadData({ ...nextFilter, building_id: restoreBuildingId, page_index: 1 })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof FloorSearchFilter>(key: K, value: FloorSearchFilter[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  const handleBuildingChange = (buildingId: number) => {
    void loadData({ ...filter, building_id: buildingId, page_index: 1 })
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })

  // Server-side filter: reload from page 1 keeping the typed search text, page size and tower context.
  const handleStatusChange = (status: FloorStatusFilter) => void loadData(withFloorStatus(draftFilter, status))

  const handleReset = () => void loadData({
    ...emptyFloorFilter,
    project_id: filter.project_id,
    building_id: filter.building_id,
    page_size: filter.page_size
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
    selectedBuilding,
    buildingOptions,
    buildingsLoading,
    buildingsError,
    loadData,
    loadBuildingOptions,
    updateDraftFilter,
    handleBuildingChange,
    handleSearch,
    handleStatusChange,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
