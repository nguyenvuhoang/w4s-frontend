'use client'

import { useState } from 'react'

import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VpnKeyIcon from '@mui/icons-material/VpnKey'

import type { Locale } from '@/configs/i18n'
import type { RowActionConfig } from '@/shared/components/table/RowActionMenu'
import SwalAlert from '@/shared/utils/SwalAlert'

import { buildStaffUpdatePayloadFromAccount, staffService } from '../services/staffService'
import type { StaffDictionary, StaffModel, StaffStatus } from '../types'
import { requiresStaffGenderSelection } from '../utils/staffGender'
import { getStaffFullName, staffText } from '../components/staff-list/staffListHelpers'

type Params = {
    dictionary: StaffDictionary
    locale: Locale
    sessiontoken?: string
    text_namespace?: 'staffs' | 'residents_tenants'
    /** Same isSuperAdmin check StaffDetailContent already gates Modify/Delete/Status toggle on. */
    canModify: boolean
    onNavigateToDetail: (row: StaffModel) => void
    /** useStaffList's existing openModifyDialog — it already fetches the full detail before
     *  opening StaffModifyDialog, so the edit form is never built from the leaner list row. */
    onOpenModify: (row: StaffModel, status?: StaffStatus) => void
    onReloaded: () => void | Promise<void>
}

const getStaffUserCode = (row: StaffModel) => row.user_code || row.user_id

/**
 * Row action config for the Staff list — reuses exactly the capabilities StaffDetailContent
 * already exposes (toggle status, change password, delete via staffService), just one click
 * earlier from the list's "..." menu. No new workflow/API is introduced.
 */
export const useStaffRowActions = ({
    dictionary,
    locale,
    sessiontoken,
    text_namespace = 'staffs',
    canModify,
    onNavigateToDetail,
    onOpenModify,
    onReloaded
}: Params) => {
    const [busyUserCode, setBusyUserCode] = useState<string | null>(null)

    const [deleteTarget, setDeleteTarget] = useState<StaffModel | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const [passwordTarget, setPasswordTarget] = useState<StaffModel | null>(null)
    const [changingPassword, setChangingPassword] = useState(false)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    const openDeleteDialog = (row: StaffModel) => {
        setDeleteError(null)
        setDeleteTarget(row)
    }

    const closeDeleteDialog = () => {
        if (deleting) return
        setDeleteTarget(null)
        setDeleteError(null)
    }

    const confirmDelete = async () => {
        if (!deleteTarget || deleting) return

        const usercode = getStaffUserCode(deleteTarget)

        if (!usercode) {
            setDeleteError(staffText(dictionary, 'delete_usercode_required', 'User code is required.', text_namespace))

            return
        }

        setDeleting(true)
        setDeleteError(null)

        try {
            await staffService.delete_staff({ sessiontoken, language: locale, user_id: usercode })

            setDeleteTarget(null)
            SwalAlert('success', staffText(dictionary, 'delete_user_success', 'User deleted successfully.', text_namespace), 'top-end')
            await onReloaded()
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : staffText(dictionary, 'delete_user_failed', 'Unable to delete user.', text_namespace))
        } finally {
            setDeleting(false)
        }
    }

    const openChangePasswordDialog = (row: StaffModel) => {
        setPasswordError(null)
        setPasswordTarget(row)
    }

    const closeChangePasswordDialog = () => {
        if (changingPassword) return
        setPasswordTarget(null)
        setPasswordError(null)
    }

    const confirmChangePassword = async (password: string) => {
        if (!passwordTarget || changingPassword) return

        const usercode = getStaffUserCode(passwordTarget)

        if (!usercode) {
            setPasswordError(staffText(dictionary, 'assign_admin_usercode_required', 'User code is required.', text_namespace))

            return
        }

        setChangingPassword(true)
        setPasswordError(null)

        try {
            await staffService.set_staff_password({ sessiontoken, language: locale, usercode, password })

            setPasswordTarget(null)
            SwalAlert('success', staffText(dictionary, 'change_password_success', 'Password changed successfully.', text_namespace), 'center')
        } catch (error) {
            setPasswordError(error instanceof Error ? error.message : staffText(dictionary, 'change_password_failed', 'Change password failed.', text_namespace))
        } finally {
            setChangingPassword(false)
        }
    }

    const handleToggleStatus = async (row: StaffModel) => {
        const usercode = getStaffUserCode(row)

        if (!usercode) return

        const next_status = row.status === 'A' ? 'I' : 'A'
        const is_activating = next_status === 'A'

        setBusyUserCode(usercode)

        try {
            // Same fetch-then-update pair as useStaffDetail.toggleStatus: update_staff takes the
            // full profile, and the list row alone is missing fields (gender/birthday/address/
            // description) that would otherwise get silently blanked out by the update.
            const full_detail = await staffService.get_staff_detail({ sessiontoken, language: locale, usercode })

            if (requiresStaffGenderSelection(full_detail.account?.gender, true)) {
                onOpenModify(row, next_status)

                return
            }

            await staffService.update_staff({
                sessiontoken,
                language: locale,
                payload: { ...buildStaffUpdatePayloadFromAccount(full_detail.account), status: next_status }
            })

            SwalAlert(
                'success',
                is_activating
                    ? staffText(dictionary, 'activate_user_success', 'User activated successfully.', text_namespace)
                    : staffText(dictionary, 'deactivate_user_success', 'User deactivated successfully.', text_namespace),
                'top-end'
            )
            await onReloaded()
        } catch (error) {
            SwalAlert('error', error)
        } finally {
            setBusyUserCode(null)
        }
    }

    const getRowActions = (row: StaffModel): RowActionConfig<StaffModel>[] => {
        const usercode = getStaffUserCode(row)
        const busy = Boolean(usercode) && busyUserCode === usercode
        const is_active = row.status === 'A'

        return [
            {
                key: 'view',
                label: staffText(dictionary, 'view_detail', 'View detail', text_namespace),
                icon: <VisibilityOutlinedIcon fontSize="small" />,
                onClick: onNavigateToDetail
            },
            {
                key: 'modify',
                label: staffText(dictionary, 'modify', 'Modify', text_namespace),
                icon: <EditOutlinedIcon fontSize="small" />,
                permission: canModify,
                visibleWhen: item => item.status !== 'D',
                onClick: onOpenModify
            },
            {
                key: 'change_password',
                label: staffText(dictionary, 'change_password', 'Change Password', text_namespace),
                icon: <VpnKeyIcon fontSize="small" />,
                // Matches StaffDetailContent: change-password has no extra isSuperAdmin gate
                // beyond whatever access already let the user open this list.
                visibleWhen: item => item.status !== 'D',
                onClick: openChangePasswordDialog
            },
            {
                key: 'toggle_status',
                label: is_active
                    ? staffText(dictionary, 'deactivate_user', 'Deactivate', text_namespace)
                    : staffText(dictionary, 'activate_user', 'Activate', text_namespace),
                icon: is_active ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />,
                color: is_active ? 'warning' : 'success',
                permission: canModify,
                visibleWhen: item => item.status !== 'D',
                disabledWhen: () => busy,
                confirm: {
                    title: is_active
                        ? staffText(dictionary, 'deactivate_user', 'Deactivate', text_namespace)
                        : staffText(dictionary, 'activate_user', 'Activate', text_namespace),
                    text: is_active
                        ? staffText(dictionary, 'deactivate_user_confirm', 'Are you sure you want to deactivate this user?', text_namespace)
                        : staffText(dictionary, 'activate_user_confirm', 'Are you sure you want to activate this user?', text_namespace),
                    confirmButtonText: is_active
                        ? staffText(dictionary, 'deactivate_user', 'Deactivate', text_namespace)
                        : staffText(dictionary, 'activate_user', 'Activate', text_namespace),
                    cancelButtonText: dictionary.common?.cancel ?? 'Cancel',
                    icon: 'warning'
                },
                onClick: handleToggleStatus
            },
            {
                key: 'delete',
                label: staffText(dictionary, 'delete_user', 'Delete User', text_namespace),
                icon: <DeleteOutlineIcon fontSize="small" />,
                color: 'error',
                permission: canModify,
                visibleWhen: item => item.status !== 'D',
                disabledWhen: () => busy,
                onClick: openDeleteDialog
            }
        ]
    }

    const password_target_label = passwordTarget
        ? `${staffText(dictionary, 'delete_user_target_label', 'User', text_namespace)}: ${getStaffFullName(passwordTarget)} (${getStaffUserCode(passwordTarget) || '-'})`
        : undefined

    const delete_target_name = deleteTarget ? getStaffFullName(deleteTarget) : ''
    const delete_target_code = deleteTarget ? getStaffUserCode(deleteTarget) || '' : ''

    return {
        getRowActions,
        delete_dialog_open: Boolean(deleteTarget),
        deleting,
        deleteError,
        delete_target_name,
        delete_target_code,
        closeDeleteDialog,
        confirmDelete,
        password_dialog_open: Boolean(passwordTarget),
        changingPassword,
        passwordError,
        password_target_label,
        closeChangePasswordDialog,
        confirmChangePassword
    }
}
