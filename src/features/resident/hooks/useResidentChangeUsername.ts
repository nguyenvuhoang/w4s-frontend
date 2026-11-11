import { useRef, useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'
import { residentService } from '../services/residentService'
import type { ResidentContextGeneral, ResidentDetail, ResidentListStatus } from '../types'
import { validateChangeUsernameForm, type ChangeUsernameFormErrors, type ChangeUsernameFormValues } from '../utils/residentChangeUsername'
import { buildResidentChangeUsernamePayload, buildResidentProfileFormFromGeneral, resolveResidentUserCode } from '../utils/residentUpdatePayload'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import SwalAlert from '@shared/utils/SwalAlert'

const empty_values: ChangeUsernameFormValues = { new_username: '' }

// Change Username for the resident's linked login account, via WF_BO_UPDATE_RESIDENT_PROFILE: the
// payload is the persisted resident profile (context general + detail) with only
// app_account.username changed. Kept separate from the profile/account forms' Save so neither
// flow affects the other's state, and unsaved edits in the profile tab are never sent from here.
export function useResidentChangeUsername({
    dictionary,
    sessiontoken,
    language,
    residentId,
    general,
    status,
    detail,
    current_username,
    onChanged
}: {
    dictionary: ResidentDictionary
    sessiontoken?: string
    language?: Locale
    residentId: number
    general: ResidentContextGeneral | null
    status: ResidentListStatus
    detail: ResidentDetail | null
    current_username: string
    onChanged?: (new_username: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [values, setValues] = useState<ChangeUsernameFormValues>(empty_values)
    const [field_errors, setFieldErrors] = useState<ChangeUsernameFormErrors>({})
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    // State updates are async, so a ref is what actually blocks a second click before re-render.
    const in_flight = useRef(false)

    const reset = () => {
        setValues(empty_values)
        setFieldErrors({})
        setError(null)
    }

    const openDialog = () => {
        reset()
        setOpen(true)
    }

    const closeDialog = () => {
        if (in_flight.current) return
        setOpen(false)
        reset()
    }

    const updateValue = <K extends keyof ChangeUsernameFormValues>(key: K, value: ChangeUsernameFormValues[K]) => {
        setValues(current => ({ ...current, [key]: value }))
        setFieldErrors(current => ({ ...current, [key]: undefined }))
    }

    const submit = async () => {
        if (in_flight.current) return

        const errors = validateChangeUsernameForm(dictionary, current_username, values)

        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) return

        // Without the loaded profile the payload would wipe owner/nationality/description — never send it partial.
        if (!general || !detail) {
            setError(residentText(dictionary, 'change_username_data_unavailable', 'Chưa tải đủ dữ liệu cư dân. Vui lòng tải lại trang và thử lại.'))

            return
        }

        const user_code = resolveResidentUserCode(residentId, detail, general)

        if (!user_code) {
            setError(residentText(dictionary, 'update_user_code_missing', 'Không xác định được mã user (user_code) của cư dân nên chưa thể cập nhật. Vui lòng tải lại trang và thử lại.'))

            return
        }

        const new_username = values.new_username.trim()

        in_flight.current = true
        setSubmitting(true)
        setError(null)

        try {
            await residentService.updateResidentProfile(
                buildResidentChangeUsernamePayload(residentId, buildResidentProfileFormFromGeneral(general, status, detail), user_code, new_username),
                { sessiontoken, language }
            )

            in_flight.current = false
            setOpen(false)
            reset()
            onChanged?.(new_username)

            SwalAlert(
                'success',
                residentText(dictionary, 'change_username_success_message', 'Tên đăng nhập đã được thay đổi.'),
                'center',
                false,
                false,
                true,
                undefined,
                residentText(dictionary, 'close', 'Đóng'),
                { title: residentText(dictionary, 'change_username_success_title', 'Đổi tên đăng nhập thành công') }
            )
        } catch (err) {
            // Keep the dialog open with the entered username and show the error inside it.
            const workflowError = normalizeWorkflowErrorDetail(err, {
                fallback: residentText(dictionary, 'change_username_failed', 'Không thể đổi tên đăng nhập.')
            })

            const referenceLabel = residentText(dictionary, 'error_reference_label', 'Mã tra cứu lỗi')

            setError(
                workflowError.executionId
                    ? `${workflowError.message} ${referenceLabel}: ${workflowError.executionId}`
                    : workflowError.message
            )
        } finally {
            in_flight.current = false
            setSubmitting(false)
        }
    }

    return {
        open,
        values,
        field_errors,
        error,
        submitting,
        openDialog,
        closeDialog,
        updateValue,
        submit
    }
}
