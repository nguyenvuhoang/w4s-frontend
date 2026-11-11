import { useRef, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'
import type { ResidentAccount } from '../types'
import { normalizeStaffGender, requiresStaffGenderSelection } from '@/features/staffs/utils/staffGender'
import { buildStaffUpdatePayloadFromAccount, staffService } from '@/features/staffs/services/staffService'
import type { UserAccountDetail, StaffUpdatePayload } from '@/features/staffs/types'
import SwalAlert from '@shared/utils/SwalAlert'

// WF_BO_UPDATE_USER is the confirmed Modify User workflow for this account (per product/backend
// confirmation — see docs/superpowers/plans/2026-10-23-resident-staff-integration-contracts.md
// section 4 for the audited request contract). Reuse the Staffs/User Management module's own
// service, request mapper (buildStaffUpdateWorkflowFields) and validation as-is — do not invent
// new request fields. That mapper intentionally sends only
// id/userid/username/firstname/middlename/lastname/gender/address/email/phone/description/
// department_code/status: it never sends birthday (update not supported by the workflow),
// user_level, policy_id or assign_role_id, so this call can never touch role/policy/project
// assignment or clear them — those stay fully unaffected by a resident account save.
const buildFormFromAccount = (account: ResidentAccount | null): StaffUpdatePayload | null => (
    account ? buildStaffUpdatePayloadFromAccount(account as unknown as UserAccountDetail) : null
)

export function useResidentAccountEditForm({
    dictionary,
    sessiontoken,
    language,
    account,
    onSaved
}: {
    dictionary: ResidentDictionary
    sessiontoken?: string
    language?: Locale
    account: ResidentAccount | null
    onSaved?: () => void
}) {
    const initial = buildFormFromAccount(account)
    const [form_values, setFormValues] = useState<StaffUpdatePayload | null>(initial)
    const [form_errors, setFormErrors] = useState<Partial<Record<keyof StaffUpdatePayload, string>>>({})
    const [general_error, setGeneralError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const baseline = useRef<StaffUpdatePayload | null>(initial)

    const isDirty = Boolean(form_values) && JSON.stringify(form_values) !== JSON.stringify(baseline.current)

    const updateForm = <K extends keyof StaffUpdatePayload>(key: K, value: StaffUpdatePayload[K]) => {
        setFormValues(current => (current ? { ...current, [key]: value } : current))
        setFormErrors(current => ({ ...current, [key]: undefined }))
    }

    // After Change Username (WF_BO_UPDATE_RESIDENT_PROFILE) succeeds: WF_BO_UPDATE_USER sends `username`, so both the form and
    // the baseline must carry the new login name — otherwise the next Save would send the old one.
    // Other unsaved edits in the form are kept as they are.
    const applyLoginName = (login_name: string) => {
        setFormValues(current => (current ? { ...current, login_name } : current))
        if (baseline.current) baseline.current = { ...baseline.current, login_name }
    }

    const validateForm = () => {
        if (!form_values) return false

        const errors: Partial<Record<keyof StaffUpdatePayload, string>> = {}

        if (!form_values.full_name.trim()) errors.full_name = residentText(dictionary, 'full_name_required', 'Họ và tên là bắt buộc.')
        if (requiresStaffGenderSelection(form_values.gender, true)) errors.gender = residentText(dictionary, 'account_gender_required', 'Vui lòng chọn giới tính.')
        if (!form_values.status) errors.status = residentText(dictionary, 'account_status_required', 'Vui lòng chọn trạng thái.')
        setFormErrors(errors)

        return Object.keys(errors).length === 0
    }

    const save = async () => {
        if (!form_values || !validateForm()) return

        setSaving(true)
        setGeneralError(null)

        try {
            const normalized: StaffUpdatePayload = {
                ...form_values,
                full_name: form_values.full_name.trim().replace(/\s+/g, ' '),
                email: form_values.email.trim(),
                phone: form_values.phone.trim(),
                address: form_values.address.trim()
            }

            await staffService.update_staff({
                sessiontoken,
                language,
                payload: normalized
            })

            baseline.current = normalized
            setFormValues(normalized)

            SwalAlert(
                'success',
                residentText(dictionary, 'account_edit_success_message', 'Thông tin tài khoản đăng nhập đã được cập nhật.'),
                'center',
                false,
                false,
                true,
                () => {
                    onSaved?.()
                },
                residentText(dictionary, 'close', 'Đóng'),
                { title: residentText(dictionary, 'account_edit_success_title', 'Cập nhật tài khoản thành công') }
            )
        } catch (err) {
            setGeneralError(err instanceof Error ? err.message : residentText(dictionary, 'account_edit_failed', 'Không thể cập nhật tài khoản đăng nhập.'))
        } finally {
            setSaving(false)
        }
    }

    return {
        available: Boolean(form_values),
        form_values,
        form_errors,
        general_error,
        saving,
        isDirty,
        updateForm,
        applyLoginName,
        normalizeGender: normalizeStaffGender,
        save
    }
}
