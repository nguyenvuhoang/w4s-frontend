import { useState } from 'react'
import type { Locale } from '@/configs/i18n'

import { residentText, type ResidentDictionary } from '../components/resident-list/residentListHelpers'
import { residentService } from '../services/residentService'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import SwalAlert from '@shared/utils/SwalAlert'
import type {
    Gender,
    ResidentAddApartmentPayload,
    ResidentAddHouseholdMemberPayload,
    ResidentAddMemberContext,
    ResidentListStatus,
    ResidentRelationshipCode,
    ResidentRole
} from '../types'
import { buildResidentDeletePayload } from '../utils/residentDeletePayload'

export type ResidentDetailConfirmType = 'delete' | null

export type ResidentAddApartmentMode = 'OWNER' | 'TENANT'

export type ResidentAddApartmentFormValues = {
    project_id: number | null
    project_label: string
    apartment_id: number | null
    apartment_label: string
    role: ResidentRole
    status: ResidentListStatus
}

const empty_add_apartment_form: ResidentAddApartmentFormValues = {
    project_id: null,
    project_label: '',
    apartment_id: null,
    apartment_label: '',
    role: 'OWNER',
    status: 'A'
}

export type ResidentAddMemberFormValues = {
    full_name: string
    phone: string
    email: string
    gender: Gender
    date_of_birth: string
    identity_number: string
    role: ResidentRole
    relationship_with_owner: ResidentRelationshipCode | ''
}

const empty_add_member_form: ResidentAddMemberFormValues = {
    full_name: '',
    phone: '',
    email: '',
    gender: 'M',
    date_of_birth: '',
    identity_number: '',
    role: 'MEMBER',
    relationship_with_owner: ''
}

export function useResidentDetailActions({
    dictionary,
    sessiontoken,
    language,
    residentId,
    onDeleteSuccess
}: {
    dictionary: ResidentDictionary
    sessiontoken?: string
    language?: Locale
    residentId: number
    onDeleteSuccess?: () => void
}) {
    const [confirm_type, setConfirmType] = useState<ResidentDetailConfirmType>(null)
    const [confirm_error, setConfirmError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [add_apartment_mode, setAddApartmentMode] = useState<ResidentAddApartmentMode | null>(null)
    const [add_apartment_form, setAddApartmentForm] = useState<ResidentAddApartmentFormValues>(empty_add_apartment_form)
    const [add_apartment_errors, setAddApartmentErrors] = useState<Partial<Record<keyof ResidentAddApartmentFormValues, string>>>({})
    const [add_apartment_general_error, setAddApartmentGeneralError] = useState<string | null>(null)
    const [add_apartment_saving, setAddApartmentSaving] = useState(false)

    const [add_member_context, setAddMemberContext] = useState<ResidentAddMemberContext | null>(null)
    const [add_member_form, setAddMemberForm] = useState<ResidentAddMemberFormValues>(empty_add_member_form)
    const [add_member_errors, setAddMemberErrors] = useState<Partial<Record<keyof ResidentAddMemberFormValues, string>>>({})
    const [add_member_general_error, setAddMemberGeneralError] = useState<string | null>(null)
    const [add_member_saving, setAddMemberSaving] = useState(false)

    const startDeleteConfirm = () => {
        setConfirmError(null)
        setConfirmType('delete')
    }

    const closeConfirm = () => {
        if (deleting) return

        setConfirmType(null)
        setConfirmError(null)
    }

    const handleConfirm = async () => {
        if (!confirm_type || deleting) return

        setConfirmError(null)
        setDeleting(true)

        try {
            await residentService.deleteResident(
                buildResidentDeletePayload(residentId),
                { sessiontoken, language }
            )

            setConfirmType(null)
            SwalAlert(
                'success',
                residentText(dictionary, 'delete_success_message', 'Xóa cư dân thành công.'),
                'center',
                false,
                false,
                true,
                () => {
                    onDeleteSuccess?.()
                },
                residentText(dictionary, 'close', 'Đóng'),
                { title: residentText(dictionary, 'delete_success_title', 'Xóa thành công') }
            )
        } catch (err) {
            const workflowError = normalizeWorkflowErrorDetail(err, {
                fallback: residentText(dictionary, 'delete_failed', 'Không thể xóa cư dân.')
            })
            const referenceLabel = residentText(dictionary, 'error_reference_label', 'Mã tra cứu lỗi')

            setConfirmError(
                workflowError.executionId
                    ? `${workflowError.message} ${referenceLabel}: ${workflowError.executionId}`
                    : workflowError.message
            )
        } finally {
            setDeleting(false)
        }
    }

    const openAddApartment = (mode: ResidentAddApartmentMode) => {
        setAddApartmentForm({ ...empty_add_apartment_form, role: mode })
        setAddApartmentErrors({})
        setAddApartmentGeneralError(null)
        setAddApartmentMode(mode)
    }

    const closeAddApartment = () => {
        setAddApartmentMode(null)
        setAddApartmentForm(empty_add_apartment_form)
        setAddApartmentErrors({})
        setAddApartmentGeneralError(null)
    }

    const updateAddApartmentForm = <K extends keyof ResidentAddApartmentFormValues>(key: K, value: ResidentAddApartmentFormValues[K]) => {
        setAddApartmentForm(current => {
            const next = { ...current, [key]: value }

            if (key === 'project_id') {
                next.apartment_id = null
                next.apartment_label = ''
            }

            return next
        })
        setAddApartmentErrors(current => ({ ...current, [key]: undefined }))
    }

    const validateAddApartmentForm = () => {
        const errors: Partial<Record<keyof ResidentAddApartmentFormValues, string>> = {}

        if (!add_apartment_form.project_id) errors.project_id = residentText(dictionary, 'add_apartment_project_required', 'Vui lòng chọn dự án.')
        if (!add_apartment_form.apartment_id) errors.apartment_id = residentText(dictionary, 'add_apartment_apartment_required', 'Vui lòng chọn căn hộ.')
        setAddApartmentErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleSaveAddApartment = async () => {
        if (!validateAddApartmentForm()) return

        setAddApartmentSaving(true)
        setAddApartmentGeneralError(null)

        try {
            const payload: ResidentAddApartmentPayload = {
                resident_id: residentId,
                project_id: add_apartment_form.project_id as number,
                apartment_id: add_apartment_form.apartment_id as number,
                role: add_apartment_form.role,
                status: add_apartment_form.status
            }

            await residentService.addResidentApartment(payload, { sessiontoken, language })
        } catch (err) {
            setAddApartmentGeneralError(err instanceof Error ? err.message : String(err))
        } finally {
            setAddApartmentSaving(false)
        }
    }

    const openAddMember = (context: ResidentAddMemberContext) => {
        setAddMemberContext(context)
        setAddMemberForm(empty_add_member_form)
        setAddMemberErrors({})
        setAddMemberGeneralError(null)
    }

    const closeAddMember = () => {
        setAddMemberContext(null)
        setAddMemberForm(empty_add_member_form)
        setAddMemberErrors({})
        setAddMemberGeneralError(null)
    }

    const updateAddMemberForm = <K extends keyof ResidentAddMemberFormValues>(key: K, value: ResidentAddMemberFormValues[K]) => {
        setAddMemberForm(current => {
            const next = { ...current, [key]: value }

            if (key === 'role') next.relationship_with_owner = ''

            return next
        })
        setAddMemberErrors(current => ({ ...current, [key]: undefined }))
    }

    const validateAddMemberForm = () => {
        const errors: Partial<Record<keyof ResidentAddMemberFormValues, string>> = {}
        const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!add_member_form.full_name.trim()) errors.full_name = residentText(dictionary, 'full_name_required', 'Họ và tên là bắt buộc.')
        if (!add_member_form.phone.trim()) errors.phone = residentText(dictionary, 'phone_required', 'Số điện thoại là bắt buộc.')
        if (!add_member_form.identity_number.trim()) errors.identity_number = residentText(dictionary, 'identity_required', 'CCCD/CMND là bắt buộc.')
        if (add_member_form.email && !email_pattern.test(add_member_form.email)) errors.email = residentText(dictionary, 'validation_email', 'Email không đúng định dạng.')
        if (!add_member_form.relationship_with_owner) errors.relationship_with_owner = residentText(dictionary, 'add_member_relationship_required', 'Vui lòng chọn quan hệ với chủ hộ.')
        setAddMemberErrors(errors)

        return Object.keys(errors).length === 0
    }

    const handleSaveAddMember = async () => {
        if (!add_member_context || !validateAddMemberForm()) return

        setAddMemberSaving(true)
        setAddMemberGeneralError(null)

        try {
            const payload: ResidentAddHouseholdMemberPayload = {
                apartment_id: add_member_context.apartment_id,
                full_name: add_member_form.full_name.trim(),
                phone: add_member_form.phone.trim(),
                email: add_member_form.email.trim(),
                gender: add_member_form.gender,
                date_of_birth: add_member_form.date_of_birth,
                identity_number: add_member_form.identity_number.trim(),
                role: add_member_form.role,
                relationship_with_owner: add_member_form.relationship_with_owner as ResidentRelationshipCode
            }

            await residentService.addHouseholdMember(payload, { sessiontoken, language })
        } catch (err) {
            setAddMemberGeneralError(err instanceof Error ? err.message : String(err))
        } finally {
            setAddMemberSaving(false)
        }
    }

    return {
        confirm_type,
        confirm_error,
        deleting,
        startDeleteConfirm,
        closeConfirm,
        handleConfirm,

        add_apartment_mode,
        add_apartment_form,
        add_apartment_errors,
        add_apartment_general_error,
        add_apartment_saving,
        openAddApartment,
        closeAddApartment,
        updateAddApartmentForm,
        handleSaveAddApartment,

        add_member_context,
        add_member_form,
        add_member_errors,
        add_member_general_error,
        add_member_saving,
        openAddMember,
        closeAddMember,
        updateAddMemberForm,
        handleSaveAddMember
    }
}
