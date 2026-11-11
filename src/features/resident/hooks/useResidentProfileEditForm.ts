import { useRef, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'
import { residentService } from '../services/residentService'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import SwalAlert from '@shared/utils/SwalAlert'
import type {
    ResidentContextGeneral,
    ResidentDetail,
    ResidentListStatus,
    ResidentPayload
} from '../types'
import { buildResidentProfileFormFromGeneral, buildResidentUpdateProfilePayload, resolveResidentUserCode } from '../utils/residentUpdatePayload'

export function useResidentProfileEditForm({
    dictionary,
    sessiontoken,
    language,
    residentId,
    general,
    status,
    detail,
    onSaved
}: {
    dictionary: ResidentDictionary
    sessiontoken?: string
    language?: Locale
    residentId: number
    general: ResidentContextGeneral | null
    status: ResidentListStatus
    detail: ResidentDetail | null
    onSaved?: () => void
}) {
    const initial = general ? buildResidentProfileFormFromGeneral(general, status, detail) : null
    const [form_values, setFormValues] = useState<ResidentPayload | null>(initial)
    const [form_errors, setFormErrors] = useState<Partial<Record<keyof ResidentPayload, string>>>({})
    const [general_error, setGeneralError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const baseline = useRef<ResidentPayload | null>(initial)

    const isDirty = Boolean(form_values) && JSON.stringify(form_values) !== JSON.stringify(baseline.current)

    const updateForm = <K extends keyof ResidentPayload>(key: K, value: ResidentPayload[K]) => {
        setFormValues(current => (current ? { ...current, [key]: value } : current))
        setFormErrors(current => ({ ...current, [key]: undefined }))
    }

    const validateForm = () => {
        if (!form_values) return false

        const errors: Partial<Record<keyof ResidentPayload, string>> = {}
        const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const email = form_values.email.trim()

        if (!form_values.resident_code.trim()) errors.resident_code = residentText(dictionary, 'resident_code_required', 'Mã cư dân là bắt buộc.')
        if (!form_values.full_name.trim()) errors.full_name = residentText(dictionary, 'full_name_required', 'Họ và tên là bắt buộc.')
        if (!form_values.phone.trim()) errors.phone = residentText(dictionary, 'phone_required', 'Số điện thoại là bắt buộc.')
        if (!email) errors.email = residentText(dictionary, 'email_required', 'Vui lòng nhập email.')
        else if (!email_pattern.test(email)) errors.email = residentText(dictionary, 'validation_email', 'Email không đúng định dạng.')
        setFormErrors(errors)

        return Object.keys(errors).length === 0
    }

    const save = async () => {
        if (!form_values || !validateForm()) return

        const user_code = resolveResidentUserCode(residentId, detail, general)

        if (!user_code) {
            setGeneralError(residentText(dictionary, 'update_user_code_missing', 'Không xác định được mã user (user_code) của cư dân nên chưa thể cập nhật. Vui lòng tải lại trang và thử lại.'))

            return
        }

        setSaving(true)
        setGeneralError(null)

        try {
            await residentService.updateResidentProfile(
                buildResidentUpdateProfilePayload(residentId, form_values, user_code),
                { sessiontoken, language }
            )

            baseline.current = form_values
            SwalAlert(
                'success',
                residentText(dictionary, 'edit_success_message', 'Thông tin cư dân đã được cập nhật.'),
                'center',
                false,
                false,
                true,
                () => {
                    onSaved?.()
                },
                residentText(dictionary, 'close', 'Đóng'),
                { title: residentText(dictionary, 'edit_success_title', 'Cập nhật thành công') }
            )
        } catch (err) {
            const workflowError = normalizeWorkflowErrorDetail(err, {
                fallback: residentText(dictionary, 'edit_failed', 'Không thể cập nhật cư dân.')
            })

            const referenceLabel = residentText(dictionary, 'error_reference_label', 'Mã tra cứu lỗi')

            setGeneralError(
                workflowError.executionId
                    ? `${workflowError.message} ${referenceLabel}: ${workflowError.executionId}`
                    : workflowError.message
            )
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
        save
    }
}
