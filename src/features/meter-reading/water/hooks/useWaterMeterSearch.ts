import type { SelectChangeEvent } from '@mui/material/Select'
import { useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { buildingService } from '@/features/properties/building/buildingService'
import { apartmentSearchService } from '@/features/properties/unit/services/apartmentSearchService'

import { waterMeterReadingService } from '../services/waterMeterReadingService'
import { empty_water_search_filter } from '../components/waterMeterSearchHelpers'
import { waterText } from './useWaterMeterReading'
import type {
    WaterMeterApartmentOption,
    WaterMeterBuildingOption,
    WaterMeterDictionary,
    WaterMeterPeriod,
    WaterMeterSearchFilter,
    WaterMeterSearchResponse
} from '../types'

type Params = {
    dictionary: WaterMeterDictionary
    sessiontoken?: string
    language?: Locale
    initial_filter: WaterMeterSearchFilter
    initial_data: WaterMeterSearchResponse
}

export function useWaterMeterSearch({ dictionary, sessiontoken, language, initial_filter, initial_data }: Params) {
    const workingProject = useWorkingProject()

    const [filter, setFilter] = useState<WaterMeterSearchFilter>(initial_filter)
    const [draft_filter, setDraftFilter] = useState<WaterMeterSearchFilter>(initial_filter)
    const [rows, setRows] = useState(initial_data.items)
    const [total_count, setTotalCount] = useState(initial_data.total_count)
    const [total_pages, setTotalPages] = useState(initial_data.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [building_options, setBuildingOptions] = useState<WaterMeterBuildingOption[]>([])
    const [building_options_loading, setBuildingOptionsLoading] = useState(false)
    const [apartment_options, setApartmentOptions] = useState<WaterMeterApartmentOption[]>([])
    const [apartment_options_loading, setApartmentOptionsLoading] = useState(false)
    const [period_options, setPeriodOptions] = useState<WaterMeterPeriod[]>([])
    const [period_options_loading, setPeriodOptionsLoading] = useState(false)

    const loadBuildingOptions = async (project_id: number) => {
        if (!project_id) {
            setBuildingOptions([])

            return
        }

        setBuildingOptionsLoading(true)

        try {
            const response = await buildingService.simpleSearchBuildings({
                sessiontoken,
                language,
                filter: { project_id, search_text: '', page_index: 1, page_size: 100 }
            })

            setBuildingOptions(response.items.map(building => ({ id: building.id, building_code: building.building_code, name: building.name })))
        } catch {
            setBuildingOptions([])
        } finally {
            setBuildingOptionsLoading(false)
        }
    }

    const loadApartmentOptions = async (project_id: number, building_id: number | null) => {
        if (!project_id) {
            setApartmentOptions([])

            return
        }

        setApartmentOptionsLoading(true)

        try {
            const response = await apartmentSearchService.simpleSearchApartments({
                sessiontoken,
                language,
                filter: {
                    page_size: 100,
                    page_index: 1,
                    search_text: '',
                    project_id,
                    building_id,
                    floor_id: null,
                    status: 'all',
                    qr_payment_enabled: 'all'
                }
            })

            setApartmentOptions(response.items.map(apartment => ({ id: apartment.id, apartment_code: apartment.apartment_code, building_id: apartment.building_id })))
        } catch {
            setApartmentOptions([])
        } finally {
            setApartmentOptionsLoading(false)
        }
    }

    const loadPeriodOptions = async (project_id: number) => {
        if (!project_id) {
            setPeriodOptions([])

            return
        }

        setPeriodOptionsLoading(true)

        try {
            const periods = await waterMeterReadingService.listPeriods({ sessiontoken, language, project_id })

            setPeriodOptions(periods)
        } catch {
            setPeriodOptions([])
        } finally {
            setPeriodOptionsLoading(false)
        }
    }

    const loadData = async (next_filter: WaterMeterSearchFilter = filter) => {
        if (!next_filter.project_id) {
            setRows([])
            setTotalCount(0)
            setTotalPages(0)
            setFilter(next_filter)
            setDraftFilter(next_filter)
            setError(null)

            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await waterMeterReadingService.searchReadings({ sessiontoken, language, filter: next_filter })

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter(current => ({ ...current, ...next_filter, page_index: response.page_index, page_size: response.page_size }))
            setDraftFilter(current => ({ ...current, ...next_filter, page_index: response.page_index, page_size: response.page_size }))
        } catch (err) {
            setRows([])
            setTotalCount(0)
            setTotalPages(0)
            setError(err instanceof Error ? err.message : waterText(dictionary, 'load_failed'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!workingProject) {
            setBuildingOptions([])
            setApartmentOptions([])
            setPeriodOptions([])

            return
        }

        if (filter.project_id === workingProject.id) return

        const next_filter: WaterMeterSearchFilter = { ...empty_water_search_filter, project_id: workingProject.id, page_index: 1 }

        setApartmentOptions([])
        void loadData(next_filter)
        void loadBuildingOptions(workingProject.id)
        void loadApartmentOptions(workingProject.id, null)
        void loadPeriodOptions(workingProject.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const updateDraftFilter = <K extends keyof WaterMeterSearchFilter>(key: K, value: WaterMeterSearchFilter[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleBuildingChange = (building_id: number | null) => {
        const next_filter: WaterMeterSearchFilter = { ...filter, building_id, apartment_id: null, page_index: 1 }

        setApartmentOptions([])
        setDraftFilter(current => ({ ...current, building_id, apartment_id: null }))
        if (filter.project_id) void loadApartmentOptions(filter.project_id, building_id)
        void loadData(next_filter)
    }

    const handleApartmentChange = (apartment_id: number | null) => {
        const next_filter: WaterMeterSearchFilter = { ...filter, apartment_id, page_index: 1 }

        setDraftFilter(current => ({ ...current, apartment_id }))
        void loadData(next_filter)
    }

    const handlePeriodChange = (water_meter_period_id: number | null) => {
        const next_filter: WaterMeterSearchFilter = { ...filter, water_meter_period_id, page_index: 1 }

        setDraftFilter(current => ({ ...current, water_meter_period_id }))
        void loadData(next_filter)
    }

    const handleSearch = () => void loadData({ ...draft_filter, page_index: 1 })

    const handleReset = () => {
        const next_filter: WaterMeterSearchFilter = { ...empty_water_search_filter, project_id: filter.project_id, page_size: filter.page_size }

        setApartmentOptions([])
        void loadData(next_filter)
        if (filter.project_id) void loadApartmentOptions(filter.project_id, null)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
    }

    const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
        void loadData({ ...filter, page_index })
    }

    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const page_index = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(total_pages, 1))

        void loadData({ ...filter, page_index })
    }

    return {
        filter,
        draft_filter,
        rows,
        total_count,
        total_pages,
        loading,
        error,
        selected_project: workingProject,
        building_options,
        building_options_loading,
        apartment_options,
        apartment_options_loading,
        period_options,
        period_options_loading,
        loadData,
        updateDraftFilter,
        handleBuildingChange,
        handleApartmentChange,
        handlePeriodChange,
        handleSearch,
        handleReset,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
