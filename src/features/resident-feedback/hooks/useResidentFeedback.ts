import type { SelectChangeEvent } from '@mui/material/Select'
import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { emptyResidentFeedbackFilter, residentFeedbackText } from '../components/residentFeedbackHelpers'
import { residentFeedbackService } from '../services/residentFeedbackService'
import type {
    ResidentFeedbackDictionary,
    ResidentFeedbackFilter,
    ResidentFeedbackItem,
    ResidentFeedbackSearchResponse
} from '../types'
import { ResidentFeedbackWorkflowError } from '../types'

type Params = {
    dictionary: ResidentFeedbackDictionary
    sessiontoken?: string
    language: Locale
    initialFilter: ResidentFeedbackFilter
    initialData: ResidentFeedbackSearchResponse
    initialError?: string | null
}

export const useResidentFeedback = ({
    dictionary,
    sessiontoken,
    language,
    initialFilter,
    initialData,
    initialError = null
}: Params) => {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const [filter, setFilter] = useState(initialFilter)
    const [draftFilter, setDraftFilter] = useState(initialFilter)
    const [rows, setRows] = useState(initialData.items)
    const [totalCount, setTotalCount] = useState(initialData.total_count)
    const [totalPages, setTotalPages] = useState(initialData.total_pages)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<{ message: string; executionId?: string } | null>(
        initialError ? { message: initialError } : null
    )
    const loadedProjectId = useRef<number | null>(null)

    const resolveError = useCallback((caught: unknown, fallbackKey = 'load_failed') => {
        if (caught instanceof ResidentFeedbackWorkflowError && caught.next_action === 'logout') {
            router.push(`/${language}/logout`)
        }

        return {
            message: caught instanceof Error ? caught.message : residentFeedbackText(dictionary, fallbackKey),
            executionId: caught instanceof ResidentFeedbackWorkflowError ? caught.execution_id : undefined
        }
    }, [dictionary, language, router])

    const loadData = useCallback(async (nextFilter: ResidentFeedbackFilter = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await residentFeedbackService.simpleSearchResidentFeedback({
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
            setError(resolveError(caught))

            return undefined
        } finally {
            setLoading(false)
        }
    }, [filter, language, resolveError, sessiontoken])

    useEffect(() => {
        if (!workingProject) return
        if (loadedProjectId.current === workingProject.id) return

        const shouldUseInitialFilter = loadedProjectId.current === null
        const nextFilter = shouldUseInitialFilter
            ? {
                ...initialFilter,
                project_id: initialFilter.project_id > 0 ? initialFilter.project_id : workingProject.id
            }
            : { ...emptyResidentFeedbackFilter, project_id: workingProject.id, page_index: 0 }

        loadedProjectId.current = workingProject.id
        void loadData(nextFilter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const updateDraftFilter = <K extends keyof ResidentFeedbackFilter>(key: K, value: ResidentFeedbackFilter[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => void loadData({ ...draftFilter, page_index: 0 })
    const applyFilter = (request_status: ResidentFeedbackFilter['request_status']) => {
        void loadData({ ...draftFilter, request_status, page_index: 0 })
    }
    const handleReset = () => void loadData({ ...emptyResidentFeedbackFilter, project_id: filter.project_id })

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        void loadData({ ...filter, page_size: Number(event.target.value), page_index: 0 })
    }
    const handlePageChange = (_: React.ChangeEvent<unknown>, pageIndex: number) => {
        void loadData({ ...filter, page_index: pageIndex })
    }
    const handleJumpPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const pageIndex = Math.min(Math.max(Number(event.target.value) || 1, 1), Math.max(totalPages, 1)) - 1

        void loadData({ ...filter, page_index: pageIndex })
    }

    const buildListQuery = useCallback((currentFilter: ResidentFeedbackFilter) => {
        const params = new URLSearchParams()

        if (currentFilter.search_text.trim()) params.set('search_text', currentFilter.search_text.trim())
        if (currentFilter.request_status) params.set('request_status', currentFilter.request_status)
        if (currentFilter.project_id > 0) params.set('project_id', String(currentFilter.project_id))

        params.set('page_index', String(currentFilter.page_index))
        params.set('page_size', String(currentFilter.page_size))

        return params.toString()
    }, [])

    const openDetail = useCallback((row: ResidentFeedbackItem) => {
        if (!row.request_code) {
            setError({ message: residentFeedbackText(dictionary, 'detail_missing_request_code') })

            return
        }

        const query = buildListQuery(filter)
        const encodedCode = encodeURIComponent(row.request_code)

        router.push(`/${language}/feedback/resident-feedback/${encodedCode}${query ? `?${query}` : ''}`)
    }, [buildListQuery, dictionary, filter, language, router])

    return {
        filter,
        draftFilter,
        rows,
        totalCount,
        loading,
        error,
        selectedProject: workingProject,
        loadData,
        openDetail,
        updateDraftFilter,
        applyFilter,
        handleSearch,
        handleReset,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage
    }
}
