import { useEffect, useMemo, useState } from 'react'

import { staffText } from '../components/staff-list/staffListHelpers'
import { staffService } from '../services/staffService'
import type { ProjectPickerOption, StaffDictionary } from '../types'

const PAGE_SIZE = 20

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: any
}

// Drives the inline "Project" picker on the Create staff form — same search/select-all pattern
// and the same reused workflow lookups (staffService.search_projects_for_assignment /
// search_all_projects_for_assignment) as ProjectAssignmentDialog on the Detail page, just without
// the dialog-open gating or the "assign to existing user" submit step.
export function useCreateProjectPicker({ dictionary, sessiontoken, language }: Params) {
    const [search_text, setSearchText] = useState('')
    const [applied_search_text, setAppliedSearchText] = useState('')
    const [page_index, setPageIndex] = useState(0)
    const [items, setItems] = useState<ProjectPickerOption[]>([])
    const [total_count, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [load_error, setLoadError] = useState<string | null>(null)

    const [all_projects_total_count, setAllProjectsTotalCount] = useState(0)
    const [selected, setSelected] = useState<Record<string, ProjectPickerOption>>({})
    const [select_all_loading, setSelectAllLoading] = useState(false)

    useEffect(() => {
        if (!sessiontoken) return

        let cancelled = false

        staffService.search_projects_for_assignment({ sessiontoken, language, search_text: '', page_index: 0, page_size: 1 })
            .then(result => {
                if (!cancelled) setAllProjectsTotalCount(result.total_count)
            })
            .catch(() => {
                if (!cancelled) setAllProjectsTotalCount(0)
            })

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessiontoken, language])

    useEffect(() => {
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
    }, [applied_search_text, page_index, sessiontoken, language])

    const handleSearchSubmit = () => {
        setPageIndex(0)
        setAppliedSearchText(search_text)
    }

    const handlePageChange = (page: number) => setPageIndex(Math.max(page - 1, 0))

    const selected_count = useMemo(() => Object.keys(selected).length, [selected])
    const select_all_checked = all_projects_total_count > 0 && selected_count >= all_projects_total_count
    const select_all_indeterminate = selected_count > 0 && !select_all_checked

    const isSelected = (project_code: string) => Boolean(selected[project_code])

    const toggleProject = (project: ProjectPickerOption) => {
        setSelected(prev => {
            const next = { ...prev }

            if (next[project.project_code]) delete next[project.project_code]
            else next[project.project_code] = project

            return next
        })
    }

    const selectProject = (project: ProjectPickerOption) => {
        setSelected(prev => (prev[project.project_code] ? prev : { ...prev, [project.project_code]: project }))
    }

    const handleSelectAllToggle = async () => {
        if (select_all_checked) {
            setSelected({})

            return
        }

        setSelectAllLoading(true)

        try {
            const all = await staffService.search_all_projects_for_assignment({ sessiontoken, language })
            const next: Record<string, ProjectPickerOption> = {}

            all.forEach(project => {
                next[project.project_code] = project
            })

            setSelected(next)
            setAllProjectsTotalCount(all.length)
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : staffText(dictionary, 'assign_project_load_failed', 'Unable to load projects.'))
        } finally {
            setSelectAllLoading(false)
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
        selected,
        selected_count,
        select_all_checked,
        select_all_indeterminate,
        select_all_loading,
        isSelected,
        toggleProject,
        selectProject,
        handleSelectAllToggle,
        handleSearchSubmit,
        handlePageChange
    }
}

export type CreateProjectPicker = ReturnType<typeof useCreateProjectPicker>
