import type { SelectChangeEvent } from '@mui/material/Select'
import { useCallback, useState } from 'react'

import { empty_facility_categories_filter, facilitiesText } from '../components/facility-list/facilityListHelpers'
import { facilityService } from '../services/facilityService'
import type {
    FacilitiesDictionary,
    FacilityCategoriesFilterModel,
    FacilityCategoryDetail,
    FacilityCategoryItem,
    FacilityCategorySearchResponse
} from '../types'

type Params = {
    dictionary: FacilitiesDictionary
    sessiontoken?: string
    language?: any
    initial_filter: FacilityCategoriesFilterModel
    initial_data: FacilityCategorySearchResponse
    initial_loaded?: boolean
}

export function useFacilityCategoriesList({
    dictionary,
    sessiontoken,
    language,
    initial_filter,
    initial_data,
    initial_loaded = false
}: Params) {
    const [filter, setFilter] = useState(initial_filter)
    const [draft_filter, setDraftFilter] = useState(initial_filter)
    const [rows, setRows] = useState<FacilityCategoryItem[]>(initial_data.items)
    const [total_count, setTotalCount] = useState(initial_data.total_count)
    const [total_pages, setTotalPages] = useState(initial_data.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(initial_loaded)
    const [detail_open, setDetailOpen] = useState(false)
    const [detail_loading, setDetailLoading] = useState(false)
    const [detail_error, setDetailError] = useState<string | null>(null)
    const [selected_category, setSelectedCategory] = useState<FacilityCategoryDetail | null>(null)

    const loadData = useCallback(async (next_filter: FacilityCategoriesFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await facilityService.simpleSearchFacilityCategories({
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
        } catch (err) {
            setError(err instanceof Error ? err.message : facilitiesText(dictionary, 'categories_load_failed', 'Unable to load facility categories.'))
            setLoaded(true)
        } finally {
            setLoading(false)
        }
    }, [dictionary, filter, language, sessiontoken])

    const ensureLoaded = useCallback(() => {
        if (!loaded && !loading) void loadData(filter)
    }, [filter, loadData, loaded, loading])

    const updateDraftFilter = <K extends keyof FacilityCategoriesFilterModel>(key: K, value: FacilityCategoriesFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => {
        void loadData({ ...draft_filter, page_index: 1 })
    }

    const resetFilter = () => {
        void loadData({
            ...empty_facility_categories_filter,
            project_id: draft_filter.project_id || empty_facility_categories_filter.project_id
        })
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

    const handleViewCategory = useCallback(async (row: FacilityCategoryItem) => {
        if (!row.id) {
            setDetailOpen(true)
            setDetailLoading(false)
            setSelectedCategory(null)
            setDetailError(facilitiesText(dictionary, 'category_id_not_found', 'Facility category ID was not found.'))

            return
        }

        setDetailOpen(true)
        setDetailLoading(true)
        setDetailError(null)
        setSelectedCategory(null)

        try {
            const detail = await facilityService.getFacilityCategoryById({
                sessiontoken,
                language,
                id: row.id
            })

            setSelectedCategory(detail)
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : facilitiesText(dictionary, 'category_detail_load_failed', 'Unable to load facility category detail.'))
        } finally {
            setDetailLoading(false)
        }
    }, [dictionary, language, sessiontoken])

    const closeDetail = () => {
        setDetailOpen(false)
        setDetailLoading(false)
        setDetailError(null)
        setSelectedCategory(null)
    }

    return {
        filter,
        draft_filter,
        rows,
        total_count,
        loading,
        error,
        loaded,
        detail_open,
        detail_loading,
        detail_error,
        selected_category,
        loadData,
        ensureLoaded,
        updateDraftFilter,
        handleSearch,
        resetFilter,
        handleRefresh,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage,
        handleViewCategory,
        closeDetail
    }
}
