import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'
import Swal from 'sweetalert2'

import SwalAlert from '@/shared/utils/SwalAlert'

import { buildCommandTree, buildStaffUpdatePayloadFromAccount, getDetailFullName, mapBoolChip, staffService } from '../services/staffService'
import type { StaffDictionary, StaffOperationResponse, StaffOperationRole, StaffUpdatePayload, UserCommandPermission, UserDetailResponse, UserProjectAssignmentItem } from '../types'
import { empty_staff_filter, staffText } from '../components/staff-list/staffListHelpers'
import { requiresStaffGenderSelection } from '../utils/staffGender'

const empty_operation: StaffOperationResponse = { operation_header: [], operation_body: [] }

const flattenCommands = (commands: UserCommandPermission[]): UserCommandPermission[] => (
    commands.flatMap(command => [command, ...flattenCommands(command.children ?? [])])
)

const stripActionNodes = (commands: UserCommandPermission[]): UserCommandPermission[] => (
    commands
        .filter(command => command.command_type === 'M')
        .map(command => ({
            ...command,
            children: stripActionNodes(command.children ?? [])
        }))
)

const buildUpdateForm = (detail: UserDetailResponse): StaffUpdatePayload => {
    return buildStaffUpdatePayloadFromAccount(detail.account)
}

const allowed_avatar_extensions = ['png', 'jpg', 'jpeg', 'webp']
const allowed_avatar_mime_types = ['image/png', 'image/jpeg', 'image/webp']
const max_avatar_size_bytes = 5 * 1024 * 1024

type AuditActorNames = {
    user_created: string
    user_modified: string
}

const empty_audit_actor_names: AuditActorNames = {
    user_created: '-',
    user_modified: '-'
}

type Params = {
    dictionary: StaffDictionary
    sessiontoken?: string
    language?: any
    route_usercode?: string
}

export function useStaffDetail(detail: UserDetailResponse, params: Params) {
    const router = useRouter()
    const [current_detail, setCurrentDetail] = useState(detail)
    const [modify_open, setModifyOpen] = useState(false)
    const [modify_form, setModifyForm] = useState<StaffUpdatePayload>(() => buildUpdateForm(detail))
    const [modify_errors, setModifyErrors] = useState<Partial<Record<keyof StaffUpdatePayload, string>>>({})
    const [modify_modal_error, setModifyModalError] = useState<string | null>(null)
    const [modify_avatar_file, setModifyAvatarFile] = useState<File | null>(null)
    const [modify_avatar_preview_url, setModifyAvatarPreviewUrl] = useState<string | null>(null)
    const [modify_avatar_error, setModifyAvatarError] = useState<string | null>(null)
    const [modify_saving_label, setModifySavingLabel] = useState<string | null>(null)
    const [saving_modify, setSavingModify] = useState(false)
    const [assigning_admin, setAssigningAdmin] = useState(false)
    const [delete_open, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [delete_error, setDeleteError] = useState<string | null>(null)
    const [toggling_status, setTogglingStatus] = useState(false)
    const [change_password_open, setChangePasswordOpen] = useState(false)
    const [changing_password, setChangingPassword] = useState(false)
    const [change_password_error, setChangePasswordError] = useState<string | null>(null)
    const [permission_tab_opened, setPermissionTabOpened] = useState(false)
    const [permission_data_version, setPermissionDataVersion] = useState(0)

    const openPermissionTab = () => setPermissionTabOpened(true)

    const account = current_detail.account
    const user_avatar = current_detail.user_avatar ?? null
    const full_name = getDetailFullName(account) || account?.login_name || account?.user_name || '-'
    const [audit_actor_names, setAuditActorNames] = useState<AuditActorNames>(empty_audit_actor_names)
    const command_tree = useMemo(() => buildCommandTree(current_detail.commands), [current_detail.commands])
    const menu_tree = useMemo(() => stripActionNodes(command_tree), [command_tree])
    const flattened_menu = useMemo(() => flattenCommands(menu_tree), [menu_tree])
    const [selected_menu_id, setSelectedMenuId] = useState<string>('')
    const selected_menu = flattened_menu.find(command => command.command_id === selected_menu_id) ?? flattened_menu[0] ?? null

    const overview = useMemo(() => {
        const commands = current_detail.commands

        return {
            total_roles: current_detail.user_roles.length,
            total_commands: commands.length,
            total_menu_commands: commands.filter(item => item.command_type === 'M').length,
            total_action_permissions: commands.filter(item => item.command_type === 'C').length,
            total_invoke_allowed: commands.filter(item => mapBoolChip(item.invoke)).length,
            total_approve_allowed: commands.filter(item => mapBoolChip(item.approve)).length
        }
    }, [current_detail.commands, current_detail.user_roles.length])

    const [operation, setOperation] = useState<StaffOperationResponse>(empty_operation)
    const [operation_loading, setOperationLoading] = useState(false)
    const [operation_error, setOperationError] = useState<string | null>(null)

    const [project_assignments, setProjectAssignments] = useState<UserProjectAssignmentItem[]>([])
    const [project_assignments_loading, setProjectAssignmentsLoading] = useState(false)
    const [project_assignments_error, setProjectAssignmentsError] = useState<string | null>(null)

    // Audit fields may contain user_code/user_id rather than a display name. Reuse the existing
    // staff search workflow to resolve those references; never render an unresolved identifier.
    useEffect(() => {
        const references = {
            user_created: account?.user_created?.trim() ?? '',
            user_modified: account?.user_modified?.trim() ?? ''
        }
        const unique_references = Array.from(new Set(Object.values(references).filter(Boolean)))

        if (unique_references.length === 0 || !params.sessiontoken) {
            setAuditActorNames(empty_audit_actor_names)

            return
        }

        let cancelled = false

        const resolve_actor_name = async (reference: string) => {
            const result = await staffService.search_users({
                sessiontoken: params.sessiontoken,
                language: params.language,
                filter: {
                    ...empty_staff_filter,
                    search_text: reference,
                    page_index: 1,
                    page_size: 10
                }
            })
            const actor = result.items.find(item => (
                reference === item.user_code
                || reference === item.user_id
                || reference === item.login_name
                || reference === item.user_name
                || reference === String(item.id)
            ))

            if (actor) return getDetailFullName(actor) || actor.user_name || actor.login_name || '-'

            // Some audit payloads contain the identifier accepted by the detail workflow but
            // not indexed by the simple search. Reuse that existing lookup as a fallback.
            const detail = await staffService.get_staff_detail({
                sessiontoken: params.sessiontoken,
                language: params.language,
                usercode: reference
            })

            return getDetailFullName(detail.account) || detail.account?.user_name || detail.account?.login_name || '-'
        }

        void Promise.all(unique_references.map(async reference => [reference, await resolve_actor_name(reference).catch(() => '-')] as const))
            .then(results => {
                if (cancelled) return

                const resolved = new Map(results)

                setAuditActorNames({
                    user_created: references.user_created ? resolved.get(references.user_created) ?? '-' : '-',
                    user_modified: references.user_modified ? resolved.get(references.user_modified) ?? '-' : '-'
                })
            })
            .catch(() => {
                if (!cancelled) setAuditActorNames(empty_audit_actor_names)
            })

        return () => {
            cancelled = true
        }
    }, [account?.user_created, account?.user_modified, params.sessiontoken, params.language])

    const user_role_ids = useMemo(
        () => current_detail.user_roles.map(role => role.role_id).filter((role_id): role_id is number => typeof role_id === 'number'),
        [current_detail.user_roles]
    )

    const dynamic_operation_columns = useMemo(
        () => operation.operation_header.map(header => ({ cmdid: header.cmdid, caption: header.caption, label: header.label })),
        [operation.operation_header]
    )

    const operation_roles = useMemo(() => {
        const roles = new Map<number, StaffOperationRole>()

        operation.operation_body
            .filter(row => user_role_ids.includes(row.role_id))
            .forEach(row => {
                if (!roles.has(row.role_id)) {
                    roles.set(row.role_id, { role_id: row.role_id, role_name: row.role_name || String(row.role_id), commands: {} })
                }

                roles.get(row.role_id)!.commands[row.command_id] = row
            })

        return Array.from(roles.values())
    }, [operation.operation_body, user_role_ids])

    useEffect(() => {
        const command_id = selected_menu?.command_id

        if (!permission_tab_opened || !command_id) {
            setOperation(empty_operation)
            setOperationError(null)

            return
        }

        let cancelled = false

        setOperationLoading(true)
        setOperationError(null)

        staffService.get_operation({ sessiontoken: params.sessiontoken, language: params.language, command_id })
            .then(result => {
                if (cancelled) return
                setOperation(result)
            })
            .catch(err => {
                if (cancelled) return
                setOperation(empty_operation)
                setOperationError(err instanceof Error ? err.message : staffText(params.dictionary, 'load_operation_failed', 'Unable to load operation permissions.'))
            })
            .finally(() => {
                if (!cancelled) setOperationLoading(false)
            })

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permission_tab_opened, permission_data_version, selected_menu?.command_id, params.sessiontoken, params.language])

    const reloadProjectAssignments = useCallback(async () => {
        const usercode = current_detail.account?.user_code || current_detail.account?.user_id || params.route_usercode

        if (!usercode) {
            setProjectAssignments([])
            setProjectAssignmentsError(null)

            return
        }

        setProjectAssignmentsLoading(true)
        setProjectAssignmentsError(null)

        try {
            const result = await staffService.search_all_user_project_assignments({ sessiontoken: params.sessiontoken, language: params.language, usercode })

            setProjectAssignments(result)
        } catch (err) {
            setProjectAssignments([])
            setProjectAssignmentsError(err instanceof Error ? err.message : staffText(params.dictionary, 'load_project_assignments_failed', 'Unable to load assigned projects.'))
        } finally {
            setProjectAssignmentsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current_detail.account?.user_code, current_detail.account?.user_id, params.route_usercode, params.sessiontoken, params.language])

    useEffect(() => {
        void reloadProjectAssignments()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadProjectAssignments])

    useEffect(() => {
        if (!modify_avatar_file) {
            setModifyAvatarPreviewUrl(null)

            return
        }

        const preview_url = URL.createObjectURL(modify_avatar_file)

        setModifyAvatarPreviewUrl(preview_url)

        return () => URL.revokeObjectURL(preview_url)
    }, [modify_avatar_file])

    const hasModifyChanges = () => Boolean(modify_avatar_file) || JSON.stringify(modify_form) !== JSON.stringify(buildUpdateForm(current_detail))

    const openModifyDialog = () => {
        setModifyForm(buildUpdateForm(current_detail))
        setModifyErrors({})
        setModifyModalError(null)
        setModifyAvatarFile(null)
        setModifyAvatarError(null)
        setModifySavingLabel(null)
        setModifyOpen(true)
    }

    const closeModifyDialog = () => {
        setModifyOpen(false)
        setModifyForm(buildUpdateForm(current_detail))
        setModifyErrors({})
        setModifyModalError(null)
        setModifyAvatarFile(null)
        setModifyAvatarError(null)
        setModifySavingLabel(null)
    }

    const cancelModifyDialog = async () => {
        if (!hasModifyChanges()) {
            closeModifyDialog()

            return
        }

        const result = await Swal.fire({
            position: 'center',
            color: 'black',
            icon: 'warning',
            text: staffText(params.dictionary, 'close_confirm', 'Entered information will be lost. Are you sure you want to close this form?'),
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonText: params.dictionary.common?.confirm ?? 'Confirm',
            cancelButtonText: params.dictionary.common?.cancel ?? 'Cancel'
        })

        if (result.isConfirmed) closeModifyDialog()
    }

    const updateModifyForm = <K extends keyof StaffUpdatePayload>(key: K, value: StaffUpdatePayload[K]) => {
        setModifyModalError(null)
        setModifyForm(current => ({ ...current, [key]: value }))
        setModifyErrors(current => ({ ...current, [key]: undefined }))
    }

    const updateModifyAvatarFile = (file: File | null) => {
        setModifyModalError(null)
        setModifyAvatarError(null)

        if (!file) {
            setModifyAvatarFile(null)

            return
        }

        const extension = file.name.split('.').pop()?.toLowerCase() || ''

        if (!allowed_avatar_extensions.includes(extension) || (file.type && !allowed_avatar_mime_types.includes(file.type))) {
            setModifyAvatarFile(null)
            setModifyAvatarError(staffText(params.dictionary, 'avatar_invalid_type', 'Please choose a PNG, JPG, JPEG or WEBP image.'))

            return
        }

        if (file.size > max_avatar_size_bytes) {
            setModifyAvatarFile(null)
            setModifyAvatarError(staffText(params.dictionary, 'avatar_max_size', 'Avatar image must be 5MB or smaller.'))

            return
        }

        setModifyAvatarFile(file)
    }

    const validateModifyForm = (will_update_profile: boolean) => {
        const errors: Partial<Record<keyof StaffUpdatePayload, string>> = {}

        if (!Number(modify_form.id)) errors.id = staffText(params.dictionary, 'id_required', 'User id is required.')
        if (!modify_form.user_id.trim()) errors.user_id = staffText(params.dictionary, 'userid_required', 'UserId is required.')
        if (!modify_form.login_name.trim()) errors.login_name = staffText(params.dictionary, 'username_required', 'Username is required.')
        if (!modify_form.full_name.trim()) errors.full_name = staffText(params.dictionary, 'fullname_required', 'Fullname is required.')
        if (requiresStaffGenderSelection(modify_form.gender, will_update_profile)) errors.gender = staffText(params.dictionary, 'gender_required', 'Please select a gender.')
        if (!modify_form.status) errors.status = staffText(params.dictionary, 'status_required', 'Status is required.')

        setModifyErrors(errors)

        return Object.keys(errors).length === 0
    }

    const saveModify = async () => {
        setModifyModalError(null)

        const has_info_changes = JSON.stringify(modify_form) !== JSON.stringify(buildUpdateForm(current_detail))

        if (!validateModifyForm(has_info_changes)) return

        setSavingModify(true)

        try {
            const normalized_fullname = modify_form.full_name.trim().replace(/\s+/g, ' ')
            const detail_usercode = current_detail.account?.user_code || current_detail.account?.user_id || current_detail.account?.login_name || ''
            const success_message = staffText(params.dictionary, 'update_success', 'Update user successful.')

            if (modify_avatar_file) {
                const avatar_usercode = current_detail.account?.user_code || current_detail.account?.user_id || ''

                if (!avatar_usercode) {
                    throw new Error(staffText(params.dictionary, 'avatar_usercode_required', 'User code is required to change avatar.'))
                }

                setModifySavingLabel(staffText(params.dictionary, 'avatar_uploading', 'Uploading avatar...'))

                const uploaded_avatar_url = await staffService.upload_staff_avatar({
                    userCode: avatar_usercode,
                    file: modify_avatar_file
                })

                await staffService.change_staff_avatar({
                    sessiontoken: params.sessiontoken,
                    language: params.language,
                    payload: {
                        userCode: avatar_usercode,
                        avatarUrl: uploaded_avatar_url
                    }
                })
            }

            if (has_info_changes) {
                setModifySavingLabel(staffText(params.dictionary, 'updating_user_info', 'Updating user information...'))

                await staffService.update_staff({
                    sessiontoken: params.sessiontoken,
                    language: params.language,
                    payload: {
                        ...modify_form,
                        login_name: modify_form.login_name.trim(),
                        full_name: normalized_fullname,
                        email: modify_form.email.trim(),
                        phone: modify_form.phone.trim(),
                        address: modify_form.address.trim()
                    }
                })
            }

            if (detail_usercode) {
                try {
                    const fresh_detail = await staffService.get_staff_detail({
                        sessiontoken: params.sessiontoken,
                        language: params.language,
                        usercode: detail_usercode
                    })

                    setCurrentDetail(fresh_detail)
                    setModifyForm(buildUpdateForm(fresh_detail))
                } catch {
                    router.refresh()
                }
            } else {
                router.refresh()
            }
            closeModifyDialog()
            window.setTimeout(() => {
                SwalAlert('success', success_message, 'center')
            }, 120)
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(params.dictionary, 'update_failed', 'Update user failed.')

            setModifyModalError(message)
        } finally {
            setSavingModify(false)
            setModifySavingLabel(null)
        }
    }

    const reloadDetail = async (usercode = current_detail.account?.user_code || current_detail.account?.user_id || params.route_usercode || '') => {
        if (!usercode) return

        const fresh_detail = await staffService.get_staff_detail({
            sessiontoken: params.sessiontoken,
            language: params.language,
            usercode
        })

        setCurrentDetail(fresh_detail)
        setModifyForm(buildUpdateForm(fresh_detail))
        setPermissionDataVersion(version => version + 1)
    }

    const assignAdmin = async () => {
        if (assigning_admin || current_detail.account?.is_super_admin) return

        const usercode = current_detail.account?.user_code || params.route_usercode || ''

        if (!usercode) {
            SwalAlert('error', staffText(params.dictionary, 'assign_admin_usercode_required', 'User code is required.'), 'center')

            return
        }

        const result = await Swal.fire({
            position: 'center',
            color: 'black',
            icon: 'warning',
            title: staffText(params.dictionary, 'assign_admin', 'Assign to Admin'),
            html: `
                <div>${staffText(params.dictionary, 'assign_admin_confirm', 'Are you sure you want to assign this user as an administrator?')}</div>
                <div style="margin-top:8px;font-size:13px;color:#6b7280">${staffText(params.dictionary, 'assign_admin_confirm_subtitle', 'The user will be granted administrator permissions after confirmation.')}</div>
            `,
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonText: staffText(params.dictionary, 'assign_admin', 'Assign to Admin'),
            cancelButtonText: params.dictionary.common?.cancel ?? 'Cancel'
        })

        if (!result.isConfirmed) return

        setAssigningAdmin(true)

        try {
            await staffService.assign_staff_admin({
                sessiontoken: params.sessiontoken,
                userCode: usercode
            })

            await reloadDetail(usercode)
            router.refresh()
            SwalAlert('success', staffText(params.dictionary, 'assign_admin_success', 'Assign to Admin successful.'), 'center')
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(params.dictionary, 'assign_admin_failed', 'Unable to assign user to admin.')

            SwalAlert('error', message, 'center')
        } finally {
            setAssigningAdmin(false)
        }
    }

    const toggleStatus = async () => {
        if (toggling_status) return

        const usercode = current_detail.account?.user_code || current_detail.account?.user_id || params.route_usercode || ''
        const current_status = current_detail.account?.status || 'A'
        const next_status = current_status === 'A' ? 'I' : 'A'
        const is_activating = next_status === 'A'

        if (!usercode) {
            SwalAlert('error', staffText(params.dictionary, 'detail_empty', 'User detail not found.'), 'center')

            return
        }

        if (requiresStaffGenderSelection(current_detail.account?.gender, true)) {
            openModifyDialog()
            setModifyForm({ ...buildUpdateForm(current_detail), status: next_status })
            setModifyErrors({ gender: staffText(params.dictionary, 'gender_required', 'Please select a gender.') })

            return
        }

        const result = await Swal.fire({
            position: 'center',
            color: 'black',
            icon: 'warning',
            text: is_activating
                ? staffText(params.dictionary, 'activate_user_confirm', 'Are you sure you want to activate this user?')
                : staffText(params.dictionary, 'deactivate_user_confirm', 'Are you sure you want to deactivate this user?'),
            showCancelButton: true,
            allowOutsideClick: false,
            confirmButtonText: is_activating
                ? staffText(params.dictionary, 'activate_user', 'Activate')
                : staffText(params.dictionary, 'deactivate_user', 'Deactivate'),
            cancelButtonText: params.dictionary.common?.cancel ?? 'Cancel'
        })

        if (!result.isConfirmed) return

        setTogglingStatus(true)

        try {
            await staffService.update_staff({
                sessiontoken: params.sessiontoken,
                language: params.language,
                payload: {
                    ...buildUpdateForm(current_detail),
                    status: next_status
                }
            })

            await reloadDetail(usercode)
            router.refresh()
            SwalAlert(
                'success',
                is_activating
                    ? staffText(params.dictionary, 'activate_user_success', 'User activated successfully.')
                    : staffText(params.dictionary, 'deactivate_user_success', 'User deactivated successfully.'),
                'center'
            )
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : is_activating
                    ? staffText(params.dictionary, 'activate_user_failed', 'Unable to activate user.')
                    : staffText(params.dictionary, 'deactivate_user_failed', 'Unable to deactivate user.')

            SwalAlert('error', message, 'center')
        } finally {
            setTogglingStatus(false)
        }
    }

    const openChangePasswordDialog = () => {
        setChangePasswordError(null)
        setChangePasswordOpen(true)
    }

    const closeChangePasswordDialog = () => {
        if (changing_password) return

        setChangePasswordOpen(false)
        setChangePasswordError(null)
    }

    const confirmChangePassword = async (password: string) => {
        if (changing_password) return

        const usercode = current_detail.account?.user_code || current_detail.account?.user_id || params.route_usercode || ''

        if (!usercode) {
            setChangePasswordError(staffText(params.dictionary, 'assign_admin_usercode_required', 'User code is required.'))

            return
        }

        setChangingPassword(true)
        setChangePasswordError(null)

        try {
            await staffService.set_staff_password({
                sessiontoken: params.sessiontoken,
                language: params.language,
                usercode,
                password
            })

            setChangePasswordOpen(false)
            SwalAlert('success', staffText(params.dictionary, 'change_password_success', 'Password changed successfully.'), 'center')
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(params.dictionary, 'change_password_failed', 'Change password failed.')

            setChangePasswordError(message)
        } finally {
            setChangingPassword(false)
        }
    }

    const openDeleteDialog = () => {
        setDeleteError(null)
        setDeleteOpen(true)
    }

    const closeDeleteDialog = () => {
        if (deleting) return

        setDeleteOpen(false)
        setDeleteError(null)
    }

    const confirmDeleteStaff = async () => {
        if (deleting) return

        const usercode = current_detail.account?.user_code || current_detail.account?.user_id || params.route_usercode || ''

        if (!usercode) {
            setDeleteError(staffText(params.dictionary, 'delete_usercode_required', 'User code is required.'))

            return
        }

        setDeleting(true)
        setDeleteError(null)

        try {
            await staffService.delete_staff({
                sessiontoken: params.sessiontoken,
                language: params.language,
                user_id: usercode
            })

            setDeleteOpen(false)
            SwalAlert('success', staffText(params.dictionary, 'delete_user_success', 'User deleted successfully.'), 'center')
            router.push(`/${params.language}/users/staffs`)
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : staffText(params.dictionary, 'delete_user_failed', 'Unable to delete user.')

            setDeleteError(message)
        } finally {
            setDeleting(false)
        }
    }

    return {
        account,
        user_avatar,
        full_name,
        audit_actor_names,
        commands: current_detail.commands,
        overview,
        menu_tree,
        selected_menu,
        selected_menu_id,
        setSelectedMenuId,
        operation,
        operation_loading,
        operation_error,
        operation_roles,
        dynamic_operation_columns,
        project_assignments,
        project_assignments_loading,
        project_assignments_error,
        reloadProjectAssignments,
        reloadDetail,
        permission_tab_opened,
        openPermissionTab,
        modify_open,
        modify_form,
        modify_errors,
        modify_modal_error,
        modify_avatar_file,
        modify_avatar_preview_url,
        modify_avatar_error,
        modify_saving_label,
        saving_modify,
        assigning_admin,
        delete_open,
        deleting,
        delete_error,
        toggling_status,
        change_password_open,
        changing_password,
        change_password_error,
        openModifyDialog,
        cancelModifyDialog,
        updateModifyForm,
        updateModifyAvatarFile,
        saveModify,
        assignAdmin,
        toggleStatus,
        openChangePasswordDialog,
        closeChangePasswordDialog,
        confirmChangePassword,
        openDeleteDialog,
        closeDeleteDialog,
        confirmDeleteStaff
    }
}
