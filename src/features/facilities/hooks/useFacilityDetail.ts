'use client'

import { useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { facilitiesText } from '../components/facility-list/facilityListHelpers'
import { normalizeFacilityCategoryId, normalizeNumericField } from '../services/facilityFormMapper'
import { facilityService } from '../services/facilityService'
import type {
    CreateFacilityFormValues,
    FacilitiesDictionary,
    FacilityCategoryItem,
    FacilityItem,
    UpdatedFacilityDetail,
    UpdateFacilityRequest
} from '../types'

type FacilityMutationNotice = {
    severity: 'success' | 'error'
    message: string
}

type Params = {
    dictionary: FacilitiesDictionary
    locale: string
    sessiontoken?: string
    language?: any
    initial_facility: FacilityItem
    category_options: FacilityCategoryItem[]
}

export function useFacilityDetail({ dictionary, locale, sessiontoken, language, initial_facility, category_options }: Params) {
    const router = useRouter()
    const [facility, setFacility] = useState<FacilityItem>(initial_facility)
    const [edit_open, setEditOpen] = useState(false)
    const [edit_loading, setEditLoading] = useState(false)
    const [edit_error, setEditError] = useState<string | null>(null)
    const [edit_mode, setEditMode] = useState<'form' | 'success'>('form')
    const [updated_facility, setUpdatedFacility] = useState<UpdatedFacilityDetail | null>(null)
    const [edit_key, setEditKey] = useState(0)
    const [deactivate_open, setDeactivateOpen] = useState(false)
    const [deactivate_loading, setDeactivateLoading] = useState(false)
    const [mutation_notice, setMutationNotice] = useState<FacilityMutationNotice | null>(null)

    const mapUpdateFacilityPayload = (form: CreateFacilityFormValues): UpdateFacilityRequest => {
        const facility_category_id = normalizeFacilityCategoryId(form.facility_category_id)
        const selected_category = category_options.find(category => (
            Number(category.id ?? category.facility_category_id) === facility_category_id
        ))

        if (!selected_category) {
            throw new Error('The selected facility category could not be resolved')
        }

        return {
            display_order: Number(form.display_order || 1),
            name: form.name,
            deposit_amount: form.require_deposit ? normalizeNumericField(form.deposit_amount) ?? '' : '',
            status: form.status || 'A',
            facility_category_id,
            max_slots_per_day: normalizeNumericField(form.max_slots_per_day) ?? '',
            image_url: form.image_url || '',
            terms_url: form.terms_url || '',
            require_deposit: Boolean(form.require_deposit),
            id: Number(form.id),
            advance_booking_days: normalizeNumericField(form.advance_booking_days) ?? '',
            description: form.description || ''
        }
    }

    const handleOpenEdit = () => {
        setEditOpen(true)
        setEditError(null)
        setUpdatedFacility(null)
        setEditMode('form')
        setEditKey(current => current + 1)
    }

    const handleCloseEdit = () => {
        if (edit_loading) return

        setEditOpen(false)
    }

    const handleEditAgain = () => {
        setEditMode('form')
        setEditError(null)
        setEditKey(current => current + 1)
    }

    const handleUpdateFacility = async (form: CreateFacilityFormValues) => {
        setEditLoading(true)
        setEditError(null)

        try {
            const payload = mapUpdateFacilityPayload(form)
            const detail = await facilityService.updateFacility({
                sessiontoken,
                language,
                fields: payload
            })

            setUpdatedFacility(detail ? {
                ...detail,
                facility_code: detail.facility_code || facility.facility_code,
                project_id: detail.project_id ?? facility.project_id
            } : null)
            setEditMode('success')

            setFacility(current => ({
                ...current,
                name: detail?.name ?? form.name,
                description: (detail?.description ?? form.description) || null,
                image_url: (detail?.image_url ?? form.image_url) || null,
                terms_url: (detail?.terms_url ?? form.terms_url) || null,
                require_deposit: detail?.require_deposit ?? Boolean(form.require_deposit),
                deposit_amount: detail?.deposit_amount === undefined || detail?.deposit_amount === ''
                    ? (payload.deposit_amount === '' ? null : Number(payload.deposit_amount))
                    : Number(detail.deposit_amount),
                max_slots_per_day: detail?.max_slots_per_day === undefined || detail?.max_slots_per_day === ''
                    ? (payload.max_slots_per_day === '' ? null : Number(payload.max_slots_per_day))
                    : Number(detail.max_slots_per_day),
                advance_booking_days: detail?.advance_booking_days === undefined || detail?.advance_booking_days === ''
                    ? (payload.advance_booking_days === '' ? null : Number(payload.advance_booking_days))
                    : Number(detail.advance_booking_days),
                display_order: detail?.display_order ?? payload.display_order,
                status: detail?.status || payload.status,
                facility_category_id: detail?.facility_category_id ?? payload.facility_category_id
            }))

            router.refresh()
        } catch (err) {
            setEditError(err instanceof Error ? err.message : facilitiesText(dictionary, 'update_failed', 'Unable to update facility'))
        } finally {
            setEditLoading(false)
        }
    }

    const handleOpenDeactivate = () => setDeactivateOpen(true)

    const handleCloseDeactivate = () => {
        if (!deactivate_loading) setDeactivateOpen(false)
    }

    const handleDeactivateFacility = async () => {
        if (!facility.id || deactivate_loading) return

        setDeactivateLoading(true)
        setMutationNotice(null)

        try {
            await facilityService.deactivateFacility({
                sessiontoken,
                language,
                id: facility.id
            })

            setFacility(current => ({ ...current, status: 'I' }))
            setDeactivateOpen(false)
            setMutationNotice({
                severity: 'success',
                message: facilitiesText(dictionary, 'facility_deactivated', 'Facility has been deactivated.')
            })
            router.refresh()
        } catch {
            setMutationNotice({
                severity: 'error',
                message: facilitiesText(dictionary, 'deactivate_failed', 'Failed to deactivate facility.')
            })
        } finally {
            setDeactivateLoading(false)
        }
    }

    const handleCloseMutationNotice = () => setMutationNotice(null)

    const goBack = () => {
        router.push(`/${locale}/facilities/facilities?tab=facilities`)
    }

    return {
        facility,
        edit_open,
        edit_loading,
        edit_error,
        edit_mode,
        updated_facility,
        edit_key,
        deactivate_open,
        deactivate_loading,
        mutation_notice,
        handleOpenEdit,
        handleCloseEdit,
        handleEditAgain,
        handleUpdateFacility,
        handleOpenDeactivate,
        handleCloseDeactivate,
        handleDeactivateFacility,
        handleCloseMutationNotice,
        goBack
    }
}
