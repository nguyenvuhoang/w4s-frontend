'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildOperationColumns, fetchRoleMenuTree, fetchRoleOperations, filterVisibleParentMenus } from '@/services/roleOperationApi'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { MenuItem, Operation } from '@shared/types/systemTypes'

import { staffText } from '../components/staff-list/staffListHelpers'
import { mapBoolChip, staffService } from '../services/staffService'
import type { StaffDictionary, UserCommandPermission, UserPrivateRightItem } from '../types'

type RowSelection = { invoke: boolean; approve: boolean }

type MenuSelectionState = {
    self_invoke: RowSelection
    commands: Record<string, RowSelection>
}

type CommandMeta = {
    command_id: string
    command_id_detail: string
    channel_id: string
}

type MenuMeta = {
    self_invoke: CommandMeta | null
    commands: Record<string, CommandMeta>
}

const EMPTY_ROW: RowSelection = { invoke: false, approve: false }
const EMPTY_SELECTION: MenuSelectionState = { self_invoke: EMPTY_ROW, commands: {} }

const rightKey = (command_id: string, command_id_detail?: string) => `${command_id}::${command_id_detail ?? ''}`

const menuMatchesSearch = (menu: MenuItem, search: string): boolean => {
    if (!search) return true

    const haystack = `${menu.label || ''} ${menu.command_name || ''} ${menu.command_id || ''}`.toLowerCase()

    if (haystack.includes(search)) return true

    return (menu.children ?? []).some(child => menuMatchesSearch(child, search))
}

const filterMenuTree = (items: MenuItem[], search: string): MenuItem[] => {
    if (!search) return items

    return items
        .map(item => ({ ...item, children: filterMenuTree(item.children ?? [], search) }))
        .filter(item => menuMatchesSearch(item, search))
}

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: any
    target_user_code: string
    existing_rights: UserCommandPermission[]
    is_super_admin: boolean
    open: boolean
    on_saved: () => Promise<void>
}

export function useUserPrivateRightsDialog({ dictionary, sessiontoken, language, target_user_code, existing_rights, is_super_admin, open, on_saved }: Params) {
    const [submit_error, setSubmitError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [menu_search, setMenuSearch] = useState('')
    const [menu_parent, setMenuParent] = useState<MenuItem[]>([])
    const [menu_loaded, setMenuLoaded] = useState(false)
    const [menu_loading, setMenuLoading] = useState(false)
    const [menu_error, setMenuError] = useState<string | null>(null)
    const [selected_menu, setSelectedMenu] = useState<MenuItem | null>(null)
    const [operations, setOperations] = useState<Operation | undefined>(undefined)
    const [operation_loading, setOperationLoading] = useState(false)
    const [selections, setSelections] = useState<Record<string, MenuSelectionState>>({})
    const [menu_meta, setMenuMeta] = useState<Record<string, MenuMeta>>({})

    const menu_load_in_flight = useRef(false)

    const existing_rights_by_command = useMemo(() => (
        existing_rights.reduce<Record<string, RowSelection>>((result, right) => {
            if (!right.command_id) return result
            const key = rightKey(right.command_id, right.command_id_detail)
            const current = result[key] ?? EMPTY_ROW

            result[key] = {
                invoke: current.invoke || mapBoolChip(right.invoke),
                approve: current.approve || mapBoolChip(right.approve)
            }

            return result
        }, {})
    ), [existing_rights])

    const hasExistingRight = useCallback((command_id: string, command_id_detail: string, field: keyof RowSelection) => (
        existing_rights_by_command[rightKey(command_id, command_id_detail)]?.[field] ?? false
    ), [existing_rights_by_command])

    const loadMenus = useCallback(async () => {
        if (menu_load_in_flight.current) return

        if (!sessiontoken) {
            setMenuError(staffText(dictionary, 'private_rights_load_failed', 'Unable to load the list of permissions.'))
            return
        }

        menu_load_in_flight.current = true
        setMenuLoading(true)
        setMenuError(null)

        try {
            const items = await fetchRoleMenuTree(sessiontoken, 'BO', language, true)

            setMenuParent(filterVisibleParentMenus(items))
            setMenuLoaded(true)
        } catch (error) {
            setMenuParent([])
            setMenuLoaded(false)
            setMenuError(error instanceof Error ? error.message : staffText(dictionary, 'private_rights_load_failed', 'Unable to load the list of permissions.'))
        } finally {
            menu_load_in_flight.current = false
            setMenuLoading(false)
        }
    }, [dictionary, sessiontoken, language])

    useEffect(() => {
        if (!open || menu_loaded) return

        void loadMenus()
    }, [open, menu_loaded, loadMenus])

    const resetState = useCallback(() => {
        setSubmitError(null)
        setSubmitting(false)
        setMenuSearch('')
        setMenuError(null)
        setSelectedMenu(null)
        setOperations(undefined)
        setSelections({})
        setMenuMeta({})
    }, [])

    const filtered_menu_parent = useMemo(
        () => filterMenuTree(menu_parent, menu_search.trim().toLowerCase()),
        [menu_parent, menu_search]
    )

    const selectMenu = useCallback(async (menu: MenuItem) => {
        setSelectedMenu(menu)
        setSelections(prev => (prev[menu.command_id] ? prev : { ...prev, [menu.command_id]: EMPTY_SELECTION }))

        if (!sessiontoken) return

        setOperationLoading(true)

        try {
            const data = await fetchRoleOperations(sessiontoken, menu.command_id, language)

            setOperations(data)

            setMenuMeta(prev => {
                if (prev[menu.command_id]) return prev

                let self_invoke: CommandMeta | null = null
                const commands: Record<string, CommandMeta> = {}

                data.operation_body?.forEach(row => {
                    if (row.command_type === 'M' && !self_invoke) {
                        self_invoke = {
                            command_id: menu.command_id,
                            command_id_detail: String(row.command_id_detail || 'A'),
                            channel_id: row.application_code
                        }
                    }
                })

                if (!self_invoke) {
                    self_invoke = { command_id: menu.command_id, command_id_detail: 'A', channel_id: menu.application_code }
                }

                data.operation_header?.forEach(header => {
                    if (!commands[header.cmdid]) {
                        const operation = data.operation_body?.find(row => row.command_type === 'C' && row.command_id === header.cmdid)

                        commands[header.cmdid] = {
                            command_id: menu.command_id,
                            command_id_detail: String(operation?.command_id_detail || header.cmdid),
                            channel_id: operation?.application_code || menu.application_code
                        }
                    }
                })

                return { ...prev, [menu.command_id]: { self_invoke, commands } }
            })
        } finally {
            setOperationLoading(false)
        }
    }, [language, sessiontoken])

    const dynamic_columns = useMemo(() => (
        buildOperationColumns(
            operations?.operation_header,
            staffText(dictionary, 'operation', 'Operation')
        )
    ), [dictionary, operations?.operation_header])

    const current_menu_id = selected_menu?.command_id ?? ''
    const current_selection = selections[current_menu_id] ?? EMPTY_SELECTION
    const current_menu_meta = menu_meta[current_menu_id]

    const setSelfInvokeField = useCallback((field: keyof RowSelection, checked: boolean) => {
        const meta = menu_meta[current_menu_id]?.self_invoke
        if (!current_menu_id || !meta || hasExistingRight(meta.command_id, meta.command_id_detail, field)) return
        setSelections(prev => ({
            ...prev,
            [current_menu_id]: {
                self_invoke: { ...(prev[current_menu_id]?.self_invoke ?? EMPTY_ROW), [field]: checked },
                commands: prev[current_menu_id]?.commands ?? {}
            }
        }))
    }, [current_menu_id, hasExistingRight, menu_meta])

    const setCommandField = useCallback((cmdid: string, field: keyof RowSelection, checked: boolean) => {
        const meta = menu_meta[current_menu_id]?.commands[cmdid]
        if (!current_menu_id || !meta || hasExistingRight(meta.command_id, meta.command_id_detail, field)) return
        setSelections(prev => ({
            ...prev,
            [current_menu_id]: {
                self_invoke: prev[current_menu_id]?.self_invoke ?? EMPTY_ROW,
                commands: {
                    ...(prev[current_menu_id]?.commands ?? {}),
                    [cmdid]: { ...(prev[current_menu_id]?.commands?.[cmdid] ?? EMPTY_ROW), [field]: checked }
                }
            }
        }))
    }, [current_menu_id, hasExistingRight, menu_meta])

    // Approve is no longer editable from this dialog — every select-all / tick-all interaction
    // here only ever touches the 'invoke' field ("Cho phép"). Approve stays hardcoded false when
    // the payload is built.
    const toggleSelectAllInvoke = useCallback((checked: boolean) => {
        if (!current_menu_id) return
        setSelections(prev => {
            const existing = prev[current_menu_id] ?? EMPTY_SELECTION
            const next_commands: Record<string, RowSelection> = { ...existing.commands }

            dynamic_columns.forEach(col => {
                const meta = menu_meta[current_menu_id]?.commands[col.cmdid]
                if (!meta || hasExistingRight(meta.command_id, meta.command_id_detail, 'invoke')) return
                next_commands[col.cmdid] = { ...(existing.commands[col.cmdid] ?? EMPTY_ROW), invoke: checked }
            })

            const self_meta = menu_meta[current_menu_id]?.self_invoke
            const self_has_right = self_meta
                ? hasExistingRight(self_meta.command_id, self_meta.command_id_detail, 'invoke')
                : true

            return {
                ...prev,
                [current_menu_id]: {
                self_invoke: self_has_right
                    ? existing.self_invoke
                    : { ...existing.self_invoke, invoke: checked },
                    commands: next_commands
                }
            }
        })
    }, [current_menu_id, dynamic_columns, hasExistingRight, menu_meta])

    // Drives the "Tick All" checkbox in the "Cho phép" column header: checked when every
    // displayed invoke checkbox (self invoke + every dynamic command) is selected or already
    // granted, indeterminate when only some are, unchecked when none are.
    const select_all_invoke_state = useMemo(() => {
        if (!current_menu_meta) return { checked: false, indeterminate: false, eligible_count: 0 }

        let eligible_count = 0
        let checked_count = 0

        if (current_menu_meta.self_invoke) {
            eligible_count += 1
            const already = hasExistingRight(current_menu_meta.self_invoke.command_id, current_menu_meta.self_invoke.command_id_detail, 'invoke')

            if (already || current_selection.self_invoke.invoke) checked_count += 1
        }

        dynamic_columns.forEach(col => {
            const meta = current_menu_meta.commands[col.cmdid]

            if (!meta) return

            eligible_count += 1
            const already = hasExistingRight(meta.command_id, meta.command_id_detail, 'invoke')
            const row = current_selection.commands[col.cmdid]

            if (already || row?.invoke) checked_count += 1
        })

        return {
            checked: eligible_count > 0 && checked_count === eligible_count,
            indeterminate: checked_count > 0 && checked_count < eligible_count,
            eligible_count
        }
    }, [current_menu_meta, current_selection, dynamic_columns, hasExistingRight])

    const menu_selected_count = useMemo(() => (
        Object.values(selections).reduce((count, sel) => {
            const self_count = sel.self_invoke.invoke ? 1 : 0
            const command_count = Object.values(sel.commands).filter(row => row.invoke).length

            return count + self_count + command_count
        }, 0)
    ), [selections])

    const total_selected_count = menu_selected_count

    const buildPayload = useCallback((): UserPrivateRightItem[] => {
        const items: UserPrivateRightItem[] = []

        Object.entries(selections).forEach(([menuId, sel]) => {
            const meta = menu_meta[menuId]

            if (!meta) return

            // Approve is not editable from this dialog — always sent as false, never read from
            // selection state, so this UI can never grant an approve right.
            if (sel.self_invoke.invoke && meta.self_invoke) {
                items.push({
                    right_level: 'MENU',
                    command_id: meta.self_invoke.command_id,
                    command_id_detail: meta.self_invoke.command_id_detail,
                    channel_id: 'BO',
                    invoke: sel.self_invoke.invoke,
                    approve: false
                })
            }

            Object.entries(sel.commands).forEach(([cmdid, row]) => {
                if (!row.invoke) return
                const command_meta = meta.commands[cmdid]

                if (!command_meta) return

                items.push({
                    right_level: 'MENU',
                    command_id: command_meta.command_id,
                    command_id_detail: command_meta.command_id_detail,
                    channel_id: 'BO',
                    invoke: row.invoke,
                    approve: false
                })
            })
        })

        return items
    }, [selections, menu_meta])

    const submit = useCallback(async (): Promise<boolean> => {
        if (submitting) return false

        setSubmitError(null)

        if (!is_super_admin) {
            setSubmitError(staffText(dictionary, 'permission_edit_not_allowed', 'Only Super Admin can edit access rights.'))

            return false
        }

        if (!target_user_code) {
            setSubmitError(staffText(dictionary, 'private_rights_usercode_required', 'User code not found.'))

            return false
        }

        const list_user_right = buildPayload()

        if (list_user_right.length === 0) {
            setSubmitError(staffText(dictionary, 'private_rights_no_selection', 'Please select at least one right.'))

            return false
        }

        setSubmitting(true)

        try {
            await staffService.update_user_private_rights({
                sessiontoken,
                language,
                target_user_code,
                list_user_right
            })

            SwalAlert('success', staffText(dictionary, 'private_rights_success', 'Private rights added successfully.'), 'center')
            await on_saved()

            return true
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : staffText(dictionary, 'private_rights_failed', 'Unable to add private rights.'))

            return false
        } finally {
            setSubmitting(false)
        }
    }, [submitting, target_user_code, buildPayload, dictionary, is_super_admin, sessiontoken, language, on_saved])

    return {
        submit_error,
        submitting,
        menu_search,
        setMenuSearch,
        menu_loading,
        menu_error,
        loadMenus,
        filtered_menu_parent,
        selected_menu,
        selectMenu,
        dynamic_columns,
        operation_loading,
        current_selection,
        current_menu_meta,
        hasExistingRight,
        setSelfInvokeField,
        setCommandField,
        toggleSelectAllInvoke,
        select_all_invoke_state,
        menu_selected_count,
        total_selected_count,
        resetState,
        submit
    }
}

export type UseUserPrivateRightsDialogReturn = ReturnType<typeof useUserPrivateRightsDialog>
