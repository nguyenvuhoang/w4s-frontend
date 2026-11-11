import type { SelectChangeEvent } from '@mui/material/Select'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { commonText, formatVendorError, vendorsText } from '../components/vendorHelpers'
import { vendorService } from '../services/vendorService'
import type {
    VendorsDictionary,
    VendorsFilterModel,
    VendorsSearchResponse
} from '../vendorTypes'
import { VendorWorkflowError } from '../vendorTypes'

type Params = {
    dictionary: VendorsDictionary
    sessiontoken?: string
    language: Locale
    initialFilter: VendorsFilterModel
    initialData: VendorsSearchResponse
    initialError?: string | null
}

export const useVendors = ({
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
    const [error, setError] = useState<string | null>(initialError)
    const loadedProjectId = useRef<number | null>(null)

    const handleWorkflowError = useCallback((caught: unknown, fallback: string) => {
        if (caught instanceof VendorWorkflowError && caught.next_action === 'logout') {
            router.push(`/${language}/logout`)
        }

        const message = caught instanceof Error ? caught.message : fallback
        const execution_id = caught instanceof VendorWorkflowError ? caught.execution_id : undefined

        return formatVendorError(dictionary, message, execution_id)
    }, [dictionary, language, router])

    const loadData = useCallback(async (nextFilter: VendorsFilterModel = filter) => {
        setLoading(true)
        setError(null)

        try {
            const response = await vendorService.simpleSearchVendors({
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
            setError(handleWorkflowError(caught, vendorsText(dictionary, 'load_failed', 'Unable to load vendors.')))

            return undefined
        } finally {
            setLoading(false)
        }
    }, [dictionary, filter, handleWorkflowError, language, sessiontoken])

    useEffect(() => {
        if (!workingProject) return
        if (loadedProjectId.current === workingProject.id) return

        loadedProjectId.current = workingProject.id
        void loadData({ ...draftFilter, project_id: workingProject.id, page_index: 1 })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const updateDraftFilter = <K extends keyof VendorsFilterModel>(key: K, value: VendorsFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleSearch = () => void loadData({ ...draftFilter, page_index: 1 })
    const handleRefresh = () => void loadData(filter)

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
        workingProject,
        loadData,
        updateDraftFilter,
        handleSearch,
        handleRefresh,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage,
        refreshLabel: commonText(dictionary, 'refresh', 'Refresh')
    }
}
