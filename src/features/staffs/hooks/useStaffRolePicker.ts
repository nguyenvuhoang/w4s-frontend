import { useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { staffService } from '../services/staffService'
import type { StaffDictionary, StaffRoleOption, StaffRoleServiceId } from '../types'
import { staffText } from '../components/staff-list/staffListHelpers'

const ROLE_PAGE_SIZE = 10

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: Locale
}

// Search + pagination + multi-select for the "Phan quyen" section on the staff Create page.
// Selections are kept in a role_id-keyed map so they survive search text changes and page
// changes, mirroring the pattern already used by useProjectAssignmentDialog for project picking.
export function useStaffRolePicker({ dictionary, sessiontoken, language }: Params) {
    const [search_text, setSearchText] = useState('')
    const [applied_search_text, setAppliedSearchText] = useState('')
    const [page_index, setPageIndex] = useState(1)
    const [all_items, setAllItems] = useState<Record<StaffRoleServiceId, StaffRoleOption[]>>({ BO: [], MB: [] })
    const [active_service, setActiveServiceState] = useState<StaffRoleServiceId>('BO')
    const [loading, setLoading] = useState(false)
    const [load_error, setLoadError] = useState<string | null>(null)
    const [selected, setSelected] = useState<Record<number, StaffRoleOption>>({})

    useEffect(() => {
        let cancelled = false

        const loadRoles = async () => {
            setLoading(true)
            setLoadError(null)

            try {
                const [bo_roles, mb_roles] = await Promise.all([
                    staffService.search_all_roles_for_assignment({ sessiontoken, language, service_id: 'BO' }),
                    staffService.search_all_roles_for_assignment({ sessiontoken, language, service_id: 'MB' })
                ])

                if (cancelled) return
                setAllItems({ BO: bo_roles, MB: mb_roles })
            } catch (err) {
                if (cancelled) return
                setAllItems({ BO: [], MB: [] })
                setLoadError(err instanceof Error ? err.message : staffText(dictionary, 'role_picker_load_failed', 'Unable to load roles.'))
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void loadRoles()

        return () => {
            cancelled = true
        }
    }, [sessiontoken, language, dictionary])

    const filtered_items = useMemo(() => {
        const normalized_search = applied_search_text.trim().toLocaleLowerCase()

        const roles_for_service = all_items[active_service]

        if (!normalized_search) return roles_for_service

        return roles_for_service.filter(role => `${role.role_name} ${role.role_description ?? ''}`.toLocaleLowerCase().includes(normalized_search))
    }, [all_items, active_service, applied_search_text])

    const total_count = filtered_items.length
    const items = useMemo(() => {
        const start = (page_index - 1) * ROLE_PAGE_SIZE

        return filtered_items.slice(start, start + ROLE_PAGE_SIZE)
    }, [filtered_items, page_index])

    const handleSearchSubmit = () => {
        setPageIndex(1)
        setAppliedSearchText(search_text)
    }

    const handlePageChange = (page: number) => setPageIndex(Math.max(page, 1))

    const setActiveService = (service_id: StaffRoleServiceId) => {
        setActiveServiceState(service_id)
        setPageIndex(1)
    }

    const selected_count = useMemo(() => Object.keys(selected).length, [selected])
    const selected_roles = useMemo(() => Object.values(selected), [selected])
    const selected_role_ids = useMemo(() => Object.keys(selected).map(Number), [selected])

    const isSelected = (role_id: number) => Boolean(selected[role_id])

    const toggleRole = (role: StaffRoleOption) => {
        setSelected(prev => {
            const next = { ...prev }

            if (next[role.role_id]) delete next[role.role_id]
            else next[role.role_id] = role

            return next
        })
    }

    const removeRole = (role_id: number) => {
        setSelected(prev => {
            const next = { ...prev }

            delete next[role_id]

            return next
        })
    }

    const reset = () => {
        setSearchText('')
        setAppliedSearchText('')
        setPageIndex(1)
        setSelected({})
    }

    return {
        search_text,
        setSearchText,
        active_service,
        setActiveService,
        page_index,
        page_size: ROLE_PAGE_SIZE,
        items,
        total_count,
        loading,
        load_error,
        selected_roles,
        selected_role_ids,
        selected_count,
        isSelected,
        toggleRole,
        removeRole,
        handleSearchSubmit,
        handlePageChange,
        reset
    }
}
