import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import { apartmentSearchService } from '../services/apartmentSearchService'
import { apartmentText, emptyApartmentFilter } from '../apartmentHelpers'
import type {
  ApartmentBuildingOption,
  ApartmentDictionary,
  ApartmentFloorOption,
  ApartmentSearchFilter,
  ApartmentSearchResponse
} from '../types'

type Params = {
  dictionary: ApartmentDictionary
  sessiontoken?: string
  language: any
  initialFilter: ApartmentSearchFilter
  initialData: ApartmentSearchResponse
  initialBuildings?: ApartmentBuildingOption[]
  initialBuildingsError?: string | null
  initialFloors?: ApartmentFloorOption[]
  initialFloorsError?: string | null
  initialError?: string | null
}

export const useApartmentSearch = ({
  dictionary,
  sessiontoken,
  language,
  initialFilter,
  initialData,
  initialBuildings = [],
  initialBuildingsError = null,
  initialFloors = [],
  initialFloorsError = null,
  initialError = null
}: Params) => {
  const workingProject = useWorkingProject()

  const [filter, setFilter] = useState(initialFilter)
  const [draftFilter, setDraftFilter] = useState(initialFilter)
  const [rows, setRows] = useState(initialData.items)
  const [totalCount, setTotalCount] = useState(initialData.total_count)
  const [totalPages, setTotalPages] = useState(initialData.total_pages)
  // True from the first render when the mount effect below is about to load the working project's units,
  // so the table shows its skeleton instead of a brief "no data" state.
  const [loading, setLoading] = useState(() => Boolean(workingProject) && initialFilter.project_id !== workingProject?.id)
  const [error, setError] = useState<string | null>(initialError)
  const [buildingOptions, setBuildingOptions] = useState<ApartmentBuildingOption[]>(initialBuildings)
  const [buildingsLoading, setBuildingsLoading] = useState(false)
  const [buildingsError, setBuildingsError] = useState<string | null>(initialBuildingsError)
  const [floorOptions, setFloorOptions] = useState<ApartmentFloorOption[]>(initialFloors)
  const [floorsLoading, setFloorsLoading] = useState(false)
  const [floorsError, setFloorsError] = useState<string | null>(initialFloorsError)

  const selectedBuilding = buildingOptions.find(building => building.id === filter.building_id) ?? null
  const selectedFloor = floorOptions.find(floor => floor.id === filter.floor_id) ?? null

  const loadData = useCallback(async (nextFilter: ApartmentSearchFilter = filter) => {
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
      const response = await apartmentSearchService.simpleSearchApartments({
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
      setError(caught instanceof Error ? caught.message : apartmentText(dictionary, 'loadApartmentsFailed', 'Unable to load apartments.'))

      return undefined
    } finally {
      setLoading(false)
    }
  }, [dictionary, filter, language, sessiontoken])

  // Only the latest option request may apply its result: a slow response for a previous project/tower
  // must not bring back towers/floors of that old selection.
  const buildingsRequestRef = useRef(0)
  const floorsRequestRef = useRef(0)

  const loadBuildingOptions = useCallback(async (projectId: number | null) => {
    const requestId = ++buildingsRequestRef.current

    if (!projectId) {
      setBuildingOptions([])
      setBuildingsLoading(false)

      return
    }

    setBuildingsLoading(true)
    setBuildingsError(null)

    try {
      const options = await apartmentSearchService.simpleSearchBuildings({ sessiontoken, language, project_id: projectId })

      if (requestId === buildingsRequestRef.current) setBuildingOptions(options)
    } catch (caught) {
      if (requestId !== buildingsRequestRef.current) return
      setBuildingOptions([])
      setBuildingsError(caught instanceof Error ? caught.message : apartmentText(dictionary, 'loadBuildingsFailed', 'Unable to load towers.'))
    } finally {
      if (requestId === buildingsRequestRef.current) setBuildingsLoading(false)
    }
  }, [dictionary, language, sessiontoken])

  const loadFloorOptions = useCallback(async (projectId: number | null, buildingId: number | null) => {
    const requestId = ++floorsRequestRef.current

    setFloorOptions([])
    setFloorsError(null)

    if (!projectId || !buildingId) {
      setFloorsLoading(false)

      return
    }

    setFloorsLoading(true)

    try {
      const options = await apartmentSearchService.simpleSearchFloors({ sessiontoken, language, project_id: projectId, building_id: buildingId })

      if (requestId === floorsRequestRef.current) setFloorOptions(options)
    } catch (caught) {
      if (requestId !== floorsRequestRef.current) return
      setFloorOptions([])
      setFloorsError(caught instanceof Error ? caught.message : apartmentText(dictionary, 'loadFloorsFailed', 'Unable to load floors.'))
    } finally {
      if (requestId === floorsRequestRef.current) setFloorsLoading(false)
    }
  }, [dictionary, language, sessiontoken])

  useEffect(() => {
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    const nextFilter: ApartmentSearchFilter = {
      ...emptyApartmentFilter,
      page_size: filter.page_size,
      project_id: workingProject.id,
      building_id: null,
      floor_id: null
    }

    setBuildingOptions([])
    setFilter(nextFilter)
    setDraftFilter(nextFilter)
    setError(null)
    void loadFloorOptions(workingProject.id, null)
    void loadBuildingOptions(workingProject.id)
    void loadData(nextFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id])

  const updateDraftFilter = <K extends keyof ApartmentSearchFilter>(key: K, value: ApartmentSearchFilter[K]) => {
    setDraftFilter(current => ({ ...current, [key]: value }))
  }

  /** Tower changed ("" = all towers): clear the floor, reload the floors of that tower only, search from page 1. */
  const handleBuildingChange = (buildingId: number | null) => {
    const nextFilter = { ...draftFilter, building_id: buildingId, floor_id: null, page_index: 1 }

    setDraftFilter(current => ({ ...current, building_id: buildingId, floor_id: null }))
    void loadFloorOptions(filter.project_id, buildingId)
    void loadData(nextFilter)
  }

  const handleFloorChange = (floorId: number | null) => {
    const nextFilter = { ...draftFilter, floor_id: floorId, page_index: 1 }

    setDraftFilter(current => ({ ...current, floor_id: floorId }))
    void loadData(nextFilter)
  }

  const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })
  const applyFilter = <K extends 'status' | 'qr_payment_enabled'>(key: K, value: ApartmentSearchFilter[K]) => {
    void loadData({ ...draftFilter, [key]: value, page_index: 1 })
  }

  const handleReset = () => void loadData({
    ...emptyApartmentFilter,
    project_id: filter.project_id,
    building_id: filter.building_id,
    floor_id: filter.floor_id,
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
    totalPages,
    loading,
    error,
    selectedProject: workingProject,
    selectedBuilding,
    selectedFloor,
    buildingOptions,
    buildingsLoading,
    buildingsError,
    floorOptions,
    floorsLoading,
    floorsError,
    loadData,
    loadBuildingOptions,
    loadFloorOptions,
    updateDraftFilter,
    applyFilter,
    handleBuildingChange,
    handleFloorChange,
    handleSearch,
    handleReset,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage
  }
}
