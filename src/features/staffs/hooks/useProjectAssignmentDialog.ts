import { useEffect, useMemo, useState } from 'react'

import SwalAlert from '@/shared/utils/SwalAlert'

import { staffText } from '../components/staff-list/staffListHelpers'
import { staffService } from '../services/staffService'
import type { ProjectPickerOption, StaffDictionary } from '../types'

const PAGE_SIZE = 20

type AlreadyAssignedProject = {
    project_code: string
    project_name: string
}

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: any
    user_code: string
    open: boolean
    already_assigned: AlreadyAssignedProject[]
    on_assigned: () => Promise<void>
}

export function useProjectAssignmentDialog({ dictionary, sessiontoken, language, user_code, open, already_assigned, on_assigned }: Params) {
    const [search_text, setSearchText] = useState('')
    const [applied_search_text, setAppliedSearchText] = useState('')
    const [page_index, setPageIndex] = useState(0)
    const [items, setItems] = useState<ProjectPickerOption[]>([])
    const [total_count, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [load_error, setLoadError] = useState<string | null>(null)

    const [all_active_projects, setAllActiveProjects] = useState<ProjectPickerOption[]>([])
    const [all_active_projects_loaded, setAllActiveProjectsLoaded] = useState(false)
    const [selected, setSelected] = useState<Record<string, ProjectPickerOption>>({})
    const [select_all_loading, setSelectAllLoading] = useState(false)

    const [submitting, setSubmitting] = useState(false)
    const [submit_error, setSubmitError] = useState<string | null>(null)

    // Pre-select projects already assigned to this user as soon as the dialog opens.
    useEffect(() => {
        if (!open) return

        const seeded: Record<string, ProjectPickerOption> = {}

        already_assigned.forEach(item => {
            if (!item.project_code) return
            seeded[item.project_code] = { id: 0, project_code: item.project_code, project_name: item.project_name || item.project_code }
        })

        setSelected(seeded)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Selection is independent of the visible page/search results. Load the complete Active
    // universe once so the Select All state stays correct even for assigned inactive projects.
    useEffect(() => {
        if (!open || !sessiontoken) return

        let cancelled = false

        setSelectAllLoading(true)
        setAllActiveProjectsLoaded(false)

        staffService.search_all_projects_for_assignment({ sessiontoken, language })
            .then(projects => {
                if (cancelled) return
                setAllActiveProjects(projects)
                setAllActiveProjectsLoaded(true)
            })
            .catch(err => {
                if (cancelled) return
                setAllActiveProjects([])
                setLoadError(err instanceof Error ? err.message : staffText(dictionary, 'assign_project_load_failed', 'Unable to load projects.'))
            })
            .finally(() => {
                if (!cancelled) setSelectAllLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [open, sessiontoken, language, dictionary])

    // Once the Active project universe is known, drop any selected project that is not part of
    // it (e.g. a project that was assigned while still Active but has since gone Inactive or was
    // removed). Without this, such a project stays selected forever and Unselect All can never
    // bring the count to 0, and it could also leak into the submit payload.
    useEffect(() => {
        if (!all_active_projects_loaded) return

        const active_codes = new Set(all_active_projects.map(project => project.project_code))

        setSelected(previous => {
            const filtered_entries = Object.entries(previous).filter(([project_code]) => active_codes.has(project_code))

            if (filtered_entries.length === Object.keys(previous).length) return previous

            return Object.fromEntries(filtered_entries)
        })
    }, [all_active_projects_loaded, all_active_projects])

    useEffect(() => {
        if (!open) return

        let cancelled = false

        setLoading(true)
        setLoadError(null)

        staffService.search_projects_for_assignment({ sessiontoken, language, search_text: applied_search_text, page_index, page_size: PAGE_SIZE })
            .then(result => {
                if (cancelled) return
                setItems(result.items)
                setTotalCount(result.total_count)
            })
            .catch(err => {
                if (cancelled) return
                setItems([])
                setTotalCount(0)
                setLoadError(err instanceof Error ? err.message : staffText(dictionary, 'assign_project_load_failed', 'Unable to load projects.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, applied_search_text, page_index, sessiontoken, language])

    const resetState = () => {
        setSearchText('')
        setAppliedSearchText('')
        setPageIndex(0)
        setItems([])
        setTotalCount(0)
        setSelected({})
        setAllActiveProjects([])
        setAllActiveProjectsLoaded(false)
        setSubmitError(null)
    }

    const handleSearchSubmit = () => {
        setPageIndex(0)
        setAppliedSearchText(search_text)
    }

    const handlePageChange = (page: number) => setPageIndex(Math.max(page - 1, 0))

    const selected_count = useMemo(() => Object.keys(selected).length, [selected])
    const selected_active_count = useMemo(
        () => all_active_projects.reduce((count, project) => count + (selected[project.project_code] ? 1 : 0), 0),
        [all_active_projects, selected]
    )
    const select_all_checked = all_active_projects_loaded && all_active_projects.length > 0 && selected_active_count === all_active_projects.length
    const select_all_indeterminate = selected_active_count > 0 && !select_all_checked

    const isSelected = (project_code: string) => Boolean(selected[project_code])

    const toggleProject = (project: ProjectPickerOption) => {
        setSubmitError(null)
        setSelected(prev => {
            const next = { ...prev }

            if (next[project.project_code]) delete next[project.project_code]
            else next[project.project_code] = project

            return next
        })
    }

    // "Select all" always covers the complete Active universe, not just the projects currently
    // shown by the active search filter/page.
    const handleSelectAllToggle = async () => {
        setSubmitError(null)

        if (select_all_checked) {
            // Unselect All must clear every selected project, not just the Active ones, so no
            // stale/inactive project code can keep the count above 0.
            setSelected({})

            return
        }

        setSelected(previous => {
            const next = { ...previous }

            all_active_projects.forEach(project => {
                next[project.project_code] = project
            })

            return next
        })
    }

    const submit = async (): Promise<boolean> => {
        if (submitting || selected_count === 0) return false

        setSubmitting(true)
        setSubmitError(null)

        try {
            // Defensive guard: never submit a project that is not part of the loaded Active
            // universe, even if this fires before the reconciliation effect above has run.
            const active_codes = new Set(all_active_projects.map(project => project.project_code))
            const project_codes = all_active_projects_loaded
                ? Object.keys(selected).filter(project_code => active_codes.has(project_code))
                : Object.keys(selected)

            await staffService.create_user_project_assignments({
                sessiontoken,
                language,
                user_code,
                project_code: project_codes,
                user_channel_id: 'BO'
            })

            await on_assigned()

            SwalAlert(
                'success',
                staffText(dictionary, 'assign_project_success_count', 'Successfully assigned {count} project(s).').replace('{count}', String(project_codes.length)),
                'center'
            )

            return true
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : staffText(dictionary, 'assign_project_failed', 'Unable to create project assignment.'))

            return false
        } finally {
            setSubmitting(false)
        }
    }

    return {
        search_text,
        setSearchText,
        page_index,
        page_size: PAGE_SIZE,
        items,
        total_count,
        loading,
        load_error,
        selected_count,
        select_all_checked,
        select_all_indeterminate,
        select_all_loading: select_all_loading || !all_active_projects_loaded,
        isSelected,
        toggleProject,
        handleSelectAllToggle,
        submitting,
        submit_error,
        handleSearchSubmit,
        handlePageChange,
        submit,
        resetState
    }
}
