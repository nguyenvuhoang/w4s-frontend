'use client'

import { useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import SwalAlert from '@/shared/utils/SwalAlert'

import {
    buildCreateVendorFormValues,
    buildVendorFormValues,
    resolveDefaultVendorProjectId,
    vendorEditStatusOptions,
    vendorsText
} from '../components/vendorHelpers'
import { vendorService } from '../services/vendorService'
import type {
    CreateVendorRequest,
    UpdateVendorRequest,
    VendorFormValues,
    VendorItem,
    VendorProjectOption,
    VendorsDictionary
} from '../vendorTypes'

type FieldErrors = Partial<Record<keyof VendorFormValues, string>>

type Params = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
    language?: any
    mode: 'create' | 'edit'
    vendor?: VendorItem | null
    projectOptions?: VendorProjectOption[]
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[0-9+\-\s().]{6,20}$/

export const useVendorForm = ({
    dictionary,
    locale,
    sessiontoken,
    language,
    mode,
    vendor = null,
    projectOptions = []
}: Params) => {
    const router = useRouter()
    const [values, setValues] = useState<VendorFormValues>(() => (
        mode === 'edit' && vendor
            ? buildVendorFormValues(vendor)
            : buildCreateVendorFormValues(resolveDefaultVendorProjectId(projectOptions))
    ))
    const [errors, setErrors] = useState<FieldErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const isEditMode = mode === 'edit'

    const updateValue = <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => {
        setSubmitError(null)
        setValues(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const validate = () => {
        const nextErrors: FieldErrors = {}
        const phone = values.phone.trim()
        const email = values.email.trim()

        if (!isEditMode && (!Number.isFinite(Number(values.project_id)) || Number(values.project_id) <= 0)) {
            nextErrors.project_id = vendorsText(dictionary, 'project_required', 'Project is required.')
        }

        if (!values.vendor_code.trim()) {
            nextErrors.vendor_code = vendorsText(dictionary, 'vendor_code_required', 'Vendor code is required.')
        }

        if (!values.name.trim()) {
            nextErrors.name = vendorsText(dictionary, 'vendor_name_required', 'Vendor name is required.')
        }

        if (phone && !phonePattern.test(phone)) {
            nextErrors.phone = vendorsText(dictionary, 'phone_invalid', 'Phone number is invalid.')
        }

        if (email && !emailPattern.test(email)) {
            nextErrors.email = vendorsText(dictionary, 'email_invalid', 'Email is invalid.')
        }

        if (isEditMode) {
            if (!values.status.trim()) {
                nextErrors.status = vendorsText(dictionary, 'status_required', 'Status is required.')
            } else if (!vendorEditStatusOptions.includes(values.status as typeof vendorEditStatusOptions[number])) {
                nextErrors.status = vendorsText(dictionary, 'status_invalid', 'Select a valid status.')
            }
        }

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }

    const goBack = () => {
        router.push(isEditMode && vendor?.id ? `/${locale}/contracts/company/${vendor.id}` : `/${locale}/contracts/company`)
    }

    const submit = async () => {
        if (!validate()) return

        setSaving(true)
        setSubmitError(null)

        try {
            const basePayload = {
                phone: values.phone.trim(),
                tax_code: values.tax_code.trim(),
                name: values.name.trim(),
                vendor_code: values.vendor_code.trim(),
                contact_person: values.contact_person.trim(),
                address: values.address.trim(),
                email: values.email.trim()
            }

            if (isEditMode) {
                if (!vendor?.id) return

                const payload: UpdateVendorRequest = {
                    id: vendor.id,
                    phone: basePayload.phone,
                    tax_code: basePayload.tax_code,
                    name: basePayload.name,
                    vendor_code: basePayload.vendor_code,
                    contact_person: basePayload.contact_person,
                    status: values.status.trim(),
                    address: basePayload.address,
                    email: basePayload.email
                }

                await vendorService.updateVendor({
                    sessiontoken,
                    language,
                    fields: payload
                })

                SwalAlert('success', vendorsText(dictionary, 'vendor_update_success', 'Vendor updated successfully.'), 'center')
                router.push(`/${locale}/contracts/company/${vendor.id}`)
            } else {
                const payload: CreateVendorRequest = {
                    project_id: Number(values.project_id),
                    name: basePayload.name,
                    address: basePayload.address,
                    phone: basePayload.phone,
                    vendor_code: basePayload.vendor_code,
                    contact_person: basePayload.contact_person,
                    email: basePayload.email,
                    tax_code: basePayload.tax_code
                }
                const response = await vendorService.createVendor({
                    sessiontoken,
                    language,
                    fields: payload
                })

                SwalAlert('success', vendorsText(dictionary, 'vendor_create_success', 'Vendor created successfully.'), 'center')
                router.push(response.id ? `/${locale}/contracts/company/${response.id}` : `/${locale}/contracts/company`)
            }

            router.refresh()
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : vendorsText(
                    dictionary,
                    isEditMode ? 'vendor_update_failed' : 'vendor_create_failed',
                    isEditMode ? 'Unable to update vendor.' : 'Unable to create vendor.'
                )

            setSubmitError(message)
            SwalAlert('error', message, 'center')
        } finally {
            setSaving(false)
        }
    }

    return {
        values,
        errors,
        submitError,
        saving,
        isEditMode,
        statusOptions: [...vendorEditStatusOptions],
        updateValue,
        goBack,
        submit
    }
}
