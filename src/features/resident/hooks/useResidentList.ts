import type { SelectChangeEvent } from '@mui/material/Select'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import { buildingService } from '@/features/properties/building/buildingService'
import type { BuildingSearchItem } from '@/features/properties/building/types'
import SwalAlert from '@shared/utils/SwalAlert'

import {
    empty_resident_filter,
    residentText,
    type ResidentDictionary
} from '../components/resident-list/residentListHelpers'
import { residentService } from '../services/residentService'
import type {
    ResidentFilterModel,
    ResidentListResponse,
    ResidentModel
} from '../types'

export function useResidentList({
    dictionary,
    sessiontoken,
    language,
    initial_filter,
    initial_data,
    initial_residents_error = null
}: {
    dictionary: ResidentDictionary
    sessiontoken?: string
    language?: Locale
    initial_filter: ResidentFilterModel
    initial_data: ResidentListResponse
    initial_residents_error?: string | null
}) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const workingProject = useWorkingProject()
    const [filter, setFilter] = useState<ResidentFilterModel>(initial_filter)
    const [draft_filter, setDraftFilter] = useState<ResidentFilterModel>(initial_filter)
    const [rows, setRows] = useState<ResidentModel[]>(initial_data.items)
    const [total_items, setTotalItems] = useState(initial_data.total_items)
    const [total_pages, setTotalPages] = useState(initial_data.total_pages)
    const [loadingResidents, setLoadingResidents] = useState(false)
    const [error, setError] = useState<string | null>(initial_residents_error)
    const [exporting, setExporting] = useState(false)
    const [building_options, setBuildingOptions] = useState<BuildingSearchItem[]>([])
    const [buildingOptionsLoading, setBuildingOptionsLoading] = useState(false)

    // Guards a stale loadData response (superseded by a newer search/filter/page change that
    // started after it) from overwriting the newer one's data/error/loading state. This is the
    // only thing that decides whose response "wins" — it is never used to gate navigation; the
    // fix for that (see syncUrl/loadData below) is structural: the URL is synced synchronously,
    // before the network await, so no response handler ever calls router.replace at all.
    const requestIdRef = useRef(0)

    // Prevents a wasted setState after this screen has unmounted — not a correctness requirement
    // in React 19 (no warning, no crash either way), just hygiene. Deliberately not used to decide
    // whether syncUrl/navigation happens; syncUrl never runs from a response handler in the first
    // place, so there is nothing here for an unmount flag to protect on the navigation side.
    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true

        return () => {
            isMountedRef.current = false
        }
    }, [])

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

            setBuildingOptions(response.items)
        } catch {
            setBuildingOptions([])
        } finally {
            setBuildingOptionsLoading(false)
        }
    }

    // Keeps the URL in sync with the current search/paging state so refresh and deep-links land
    // on the same page. `page_index` here is the UI's 1-based value. Must only ever be called
    // with the filter we are ABOUT to search for (synchronously, before the network request) —
    // never from inside a response's .then/.catch/.finally. A response handler calling this is
    // exactly what caused the race this hook used to have: a late response's router.replace()
    // silently cancelled a still-pending router.push() to a different route, because Next.js's
    // router always discards whichever navigation is currently pending in favor of a newer one.
    // Skips the replace entirely when the target is already the canonical current URL, so a
    // no-op sync (e.g. the initial load with the default filter) never dispatches a navigation.
    const syncUrl = useCallback((next_filter: ResidentFilterModel) => {
        const params = new URLSearchParams()

        if (next_filter.keyword) params.set('keyword', next_filter.keyword)
        if (next_filter.status !== empty_resident_filter.status) params.set('status', next_filter.status)
        if (next_filter.gender !== empty_resident_filter.gender) params.set('gender', next_filter.gender)
        if (next_filter.role !== empty_resident_filter.role) params.set('role', next_filter.role)
        if (next_filter.app_usage !== empty_resident_filter.app_usage) params.set('app_usage', next_filter.app_usage)
        if (next_filter.page_index > 1) params.set('page_index', String(next_filter.page_index))
        if (next_filter.page_size !== empty_resident_filter.page_size) params.set('page_size', String(next_filter.page_size))

        const query = params.toString()

        if (query === searchParams.toString()) return

        // history.replaceState (integrated with the App Router since Next 14.1: usePathname /
        // useSearchParams stay in sync) instead of router.replace: the list is loaded client-side,
        // so a server round trip for the new query is pure overhead — router.replace re-rendered
        // page.tsx, which re-ran AuthorizedLayout (WF_BO_GET_BO_CONTEXT + WF_BO_LOAD_MENU) on every
        // filter/page change. Same convention as useAssetSearch. Next dispatches ACTION_RESTORE for
        // this, which (like router.replace's ACTION_NAVIGATE) supersedes a pending navigation — so
        // the "only call synchronously, before the request" rule above still applies unchanged.
        window.history.replaceState(window.history.state, '', query ? `${pathname}?${query}` : pathname)
    }, [pathname, searchParams])

    // Normalizes user input into the exact shape both the URL and the request are built from, so
    // syncUrl (called before the request) and the request itself never disagree with each other,
    // and never depend on anything the backend echoes back in the response.
    const normalizeFilter = (input_filter: ResidentFilterModel): ResidentFilterModel => ({
        ...input_filter,
        keyword: input_filter.keyword.trim(),
        page_index: Math.max(input_filter.page_index, 1)
    })

    const loadData = async (next_filter: ResidentFilterModel = filter) => {
        if (!next_filter.project_id) {
            // Invalidate any still-in-flight request too — its eventual response must not
            // repopulate rows/totals we're about to clear here.
            ++requestIdRef.current

            setRows([])
            setTotalItems(0)
            setTotalPages(0)
            setFilter(next_filter)
            setDraftFilter(next_filter)
            setError(null)

            return
        }

        const normalized_filter = normalizeFilter(next_filter)

        // URL sync happens synchronously, before the network await — the target URL is fully
        // decided by the input filter alone, with no dependency on the response. There is
        // therefore no async gap in which a later, unrelated navigation could still be pending
        // when this fires.
        syncUrl(normalized_filter)

        const requestId = ++requestIdRef.current
        const isProjectChange = normalized_filter.project_id !== filter.project_id

        setFilter(normalized_filter)
        setDraftFilter(normalized_filter)
        setLoadingResidents(true)
        setError(null)

        // Keep the current page visible while a page/filter refetch for the SAME project is in
        // flight (the table shows a component-level progress bar over it). Rows of another
        // project are never kept on screen while the new project's data loads.
        if (isProjectChange) setRows([])

        try {
            const response = await residentService.get_residents({
                sessiontoken,
                language,
                filter: normalized_filter
            })

            // Superseded by a newer loadData call (rapid filter/page changes) — this response's
            // data must not overwrite whatever the newer, still-in-flight request eventually
            // returns. Never gated on navigation/unmount here: syncUrl has already run above,
            // unconditionally, before this await even started.
            if (requestId !== requestIdRef.current || !isMountedRef.current) return

            setRows(response.items)
            setTotalItems(response.total_items)
            setTotalPages(response.total_pages)
        } catch (err) {
            if (requestId !== requestIdRef.current || !isMountedRef.current) return

            // Stale rows must not stay on screen under an error that says they failed to load.
            setRows([])
            setTotalItems(0)
            setTotalPages(0)
            setError(err instanceof Error ? err.message : residentText(dictionary, 'load_failed', 'Unable to load residents.'))
        } finally {
            // Only the latest request is allowed to clear loading — a stale response resolving
            // after a newer request has already started must not flip loading back to false
            // while that newer request is still genuinely in flight.
            if (requestId === requestIdRef.current) {
                setLoadingResidents(false)
            }
        }
    }

    // Project id the initial load has already been started for. A ref (not `filter` state) because
    // under React Strict Mode the effect below runs twice on the same instance before the first
    // run's setFilter commits — reading `filter.project_id` there sees the stale initial value and
    // fired WF_BO_SIMPLE_SEARCH_RESIDENTS / WF_BO_SIMPLE_SEARCH_BUILDINGS twice. The ref is
    // per-instance, so a real remount (Back/Forward, new navigation) still loads fresh data.
    const loadedProjectIdRef = useRef<number | null>(null)

    useEffect(() => {
        if (!workingProject) {
            loadedProjectIdRef.current = null
            setBuildingOptions([])

            return
        }

        if (filter.project_id === workingProject.id) return
        if (loadedProjectIdRef.current === workingProject.id) return

        loadedProjectIdRef.current = workingProject.id

        void loadData({ ...empty_resident_filter, project_id: workingProject.id, page_index: 1 })
        void loadBuildingOptions(workingProject.id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workingProject?.id])

    const handleSearch = () => {
        void loadData({ ...draft_filter, page_index: 1 })
    }

    const resetFilter = () => {
        void loadData({ ...empty_resident_filter, project_id: draft_filter.project_id })
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

    const updateDraftFilter = <K extends keyof ResidentFilterModel>(key: K, value: ResidentFilterModel[K]) => {
        setDraftFilter(current => ({ ...current, [key]: value }))
    }

    const handleFilterSelectChange = <K extends keyof ResidentFilterModel>(key: K, value: ResidentFilterModel[K]) => {
        const next_filter = { ...draft_filter, [key]: value, page_index: 1 }

        setDraftFilter(next_filter)
        void loadData(next_filter)
    }

    const handleExport = async () => {
        setExporting(true)

        try {
            const response = await residentService.exportResidentList({
                sessiontoken,
                language,
                project_codes: workingProject?.code ? [workingProject.code] : []
            })

            const url = window.URL.createObjectURL(response.blob)
            const link = document.createElement('a')

            link.href = url
            link.download = response.filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            SwalAlert('success', residentText(dictionary, 'export_excel_success', 'Xuất file Excel thành công.'), 'center')
        } catch (err) {
            const message = err instanceof Error ? err.message : residentText(dictionary, 'export_excel_failed', 'Không thể xuất file Excel.')
            const executionId = residentService.getExportErrorExecutionId(err)
            const errorReference = executionId
                ? `\n${residentText(dictionary, 'export_error_reference', 'Mã tra cứu lỗi')}: ${executionId}`
                : ''

            SwalAlert('error', `${message}${errorReference}`, 'center')
        } finally {
            setExporting(false)
        }
    }

    return {
        filter,
        draft_filter,
        rows,
        total_items,
        total_pages,
        loading: loadingResidents,
        loadingResidents,
        error,
        selectedProject: workingProject,
        building_options,
        buildingOptionsLoading,
        exporting,
        loadData,
        handleSearch,
        resetFilter,
        handlePageSizeChange,
        handlePageChange,
        handleJumpPage,
        updateDraftFilter,
        handleFilterSelectChange,
        handleExport
    }
}
