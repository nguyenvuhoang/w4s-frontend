import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useState } from 'react'

import { facilitiesText, empty_facilities_filter } from '../components/facility-list/facilityListHelpers'
import { facilityService } from '../services/facilityService'
import type {
    FacilitiesDictionary,
    FacilitiesFilterModel,
    FacilitiesSearchResponse,
    FacilityCategoryItem,
    FacilityItem
} from '../types'

type Params = {
    dictionary: FacilitiesDictionary
    sessiontoken?: string
    language?: any
    initial_filter: FacilitiesFilterModel
    initial_data: FacilitiesSearchResponse
    initial_category_options?: FacilityCategoryItem[]
    initial_loaded?: boolean
}

export function useFacilitiesList({
    dictionary,
    sessiontoken,
    language,
    initial_filter,
    initial_data,
    initial_category_options = [],
    initial_loaded = true
}: Params) {
    const [filter, setFilter] = useState(initial_filter)
    const [draft_filter, setDraftFilter] = useState(initial_filter)
    const [rows, setRows] = useState<FacilityItem[]>(initial_data.items)
    const [total_count, setTotalCount] = useState(initial_data.total_count)
    const [total_pages, setTotalPages] = useState(initial_data.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(initial_loaded)
    const [category_options, setCategoryOptions] = useState<FacilityCategoryItem[]>(initial_category_options)
    const [categories_project_id, setCategoriesProjectId] = useState<number | null>(() => (
        initial_category_options.some(category => category.project_id === initial_filter.project_id)
            ? initial_filter.project_id
            : null
    ))
    const [categories_loading, setCategoriesLoading] = useState(false)

    const loadCategoryOptions = useCallback(async (project_id: number) => {
        if (!sessiontoken) return

        setCategoriesProjectId(project_id)
        setCategoriesLoading(true)

        try {
            const response = await facilityService.simpleSearchFacilityCategories({
                sessiontoken,
                language,
                filter: {
                    search_text: '',
                    project_id,
                    page_index: 1,
                    page_size: 200
                }
            })

            setCategoryOptions(response.items)
        } catch {
            setCategoryOptions([])
        } finally {
            setCategoriesLoading(false)
        }
    }, [language, sessiontoken])

    const loadData = useCallback(async (next_filter: FacilitiesFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await facilityService.simpleSearchFacilities({
                sessiontoken,
                language,
                filter: next_filter
            })

            const resolved_filter = {
                ...next_filter,
                page_index: response.page_index,
                page_size: response.page_size
            }

            setRows(response.items)
            setTotalCount(response.total_count)
            setTotalPages(response.total_pages)
            setFilter(resolved_filter)
            setDraftFilter(resolved_filter)
            setLoaded(true)

            return response
        } catch (err) {
            setError(err instanceof Error ? err.message : facilitiesText(dictionary, 'load_failed', 'Unable to load facilities.'))
            setLoaded(true)

            return undefined
        } finally {
            setLoading(false)
        }
    }, [dictionary, filter, language, sessiontoken])

    const updateDraftFilter = <K extends keyof FacilitiesFilterModel>(key: K, value: FacilitiesFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const ensureLoaded = useCallback(() => {
        if (!loaded && !loading) void loadData(filter)
    }, [filter, loadData, loaded, loading])

    const handleSearch = () => {
        void loadData({ ...draft_filter, page_index: 1 })
    }

    const resetFilter = () => {
        void loadData({ ...empty_facilities_filter, project_id: draft_filter.project_id || empty_facilities_filter.project_id })
    }

    const handleRefresh = () => {
        void loadData(filter)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        const page_size = Number(event.target.value)

        void loadData({ ...filter, page_size, page_index: 1 })
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
        loading,
        error,
        loaded,
        category_options,
        categories_project_id,
        categories_loading,
        loadData,
        ensureLoaded,
        updateDraftFilter,
        handleSearch,
        resetFilter,
        handleRefresh,
        loadCategoryOptions,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
