/* eslint-disable react-hooks/exhaustive-deps */
import { Session } from 'next-auth'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { WorkingProjectOption } from '@/@core/stores/useWorkingProjectStore'
import type { ApartmentLookupOption } from '@/shared/services/apartmentLookupService'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import SwalAlert from '@/shared/utils/SwalAlert'
import { residentHierarchyMapper, residentService } from '../services/residentService'
import {
    CreatedResidentActivation,
    DEFAULT_RESIDENT_PROFILE_FORM_VALUES,
    ResidentApartmentFormValue,
    ResidentProfileFormValues
} from '../types'
import { localizedCatalogLabel, ResidentDictionary } from '../utils/residentLabels'
import { OWNER_ROLE } from '../utils/residentRoleRelationship'
import { buildCreateResidentProfilePayload } from '../utils/residentCreatePayload'

type CodeListSelectOption = { value: string; label: string }

const normalizeText = (value: string) => value?.trim() || ''

const OWNER_CODE_MATCH = 'OWNER'

// Both the RESIDENT_ROLE and RELATIONSHIP_WITH_OWNER dropdowns now source their values straight
// from their code lists, so "which code means Owner" has to be resolved from each loaded list
// instead of a fixed enum. Falls back to the OWNER_ROLE constant while a list is still loading.
const findOwnerCodeValue = (options: CodeListSelectOption[]) => (
    options.find(option => option.value.toUpperCase() === OWNER_CODE_MATCH)?.value ?? OWNER_ROLE
)

const isOwnerCodeValue = (value: string, options: CodeListSelectOption[]) => (
    Boolean(value) && value.toUpperCase() === findOwnerCodeValue(options).toUpperCase()
)

const resolveOptionValue = (value: string | undefined, options: CodeListSelectOption[]): string => {
    const trimmed = (value ?? '').trim()

    if (!trimmed) return ''

    const exactMatch = options.find(option => option.value === trimmed)

    if (exactMatch) return exactMatch.value

    const caseInsensitiveMatch = options.find(option => option.value.toUpperCase() === trimmed.toUpperCase())

    return caseInsensitiveMatch ? caseInsensitiveMatch.value : trimmed
}

const optionLabelForValue = (value: string, options: CodeListSelectOption[]): string => {
    if (!value) return ''

    const match = options.find(option => option.value.toUpperCase() === value.toUpperCase())

    return match?.label ?? value
}

// Role/relationship consistency is now limited to the one rule that still makes business sense
// once both lists are open, backend-driven catalogs: Owner role must pair with the Owner
// relationship code, and non-Owner roles must not use it.
const getRoleRelationshipValidationKey = (
    role: string,
    relationship: string,
    roleOptions: CodeListSelectOption[],
    relationshipOptions: CodeListSelectOption[]
): string | null => {
    if (!role || !relationship) return null

    const roleIsOwner = isOwnerCodeValue(role, roleOptions)
    const isOwnerRelationship = isOwnerCodeValue(relationship, relationshipOptions)

    if (roleIsOwner && !isOwnerRelationship) return 'validation_owner_role_requires_owner_relationship'
    if (!roleIsOwner && isOwnerRelationship) return 'validation_non_owner_role_cannot_use_owner_relationship'

    return null
}

const createRowId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const generateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const number = '23456789'
    const symbol = '!@#$%&*?'
    const all = `${upper}${lower}${number}${symbol}`
    const pick = (source: string) => source[Math.floor(Math.random() * source.length)]
    const password = [
        pick(upper),
        pick(lower),
        pick(number),
        pick(symbol),
        ...Array.from({ length: 8 }, () => pick(all))
    ]

    return password.sort(() => Math.random() - 0.5).join('')
}

export function useCreateResidentProfileForm(
    session: Session | null,
    language?: string,
    messages: {
        success: string
        failure: string
        phoneRequired?: string
        emailRequired?: string
        invalidEmail?: string
        residentRoleRequired?: string
        apartmentRequired?: string
        apartmentDuplicated?: string
        apartmentListRequired?: string
        ownerRoleRequiresOwnerRelationship?: string
        nonOwnerRoleCannotUseOwnerRelationship?: string
        invalidRoleRelationshipMapping?: string
    } = {
        success: 'Resident profile created successfully',
        failure: 'Create resident profile failed'
    },
    dictionary: ResidentDictionary = {},
    workingProject: WorkingProjectOption | null = null,
    relationshipOptions: CodeListSelectOption[] = [],
    residentRoleOptions: CodeListSelectOption[] = [],
    onCreateSuccess?: () => void
) {
    const [saving, setSaving] = useState(false)
    const [apartments, setApartments] = useState<ResidentApartmentFormValue[]>([])
    const [selectedApartment, setSelectedApartment] = useState<ApartmentLookupOption | null>(null)
    const [editingApartmentId, setEditingApartmentId] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [is_app_account_locked, setIsAppAccountLocked] = useState(false)
    const [created_resident_activation, setCreatedResidentActivation] = useState<CreatedResidentActivation | null>(null)
    const [highlightedApartmentId, setHighlightedApartmentId] = useState<string | null>(null)
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    }, [])

    const form = useForm<ResidentProfileFormValues>({
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: DEFAULT_RESIDENT_PROFILE_FORM_VALUES
    })

    const { getValues, reset, setError, setValue, clearErrors, trigger, watch } = form
    const residentRole = watch('residentRole')
    const isApartmentRelationshipLocked = isOwnerCodeValue(residentRole, residentRoleOptions)

    const getRoleRelationshipErrorMessage = useCallback((validationKey: string | null) => {
        if (validationKey === 'validation_owner_role_requires_owner_relationship') {
            return messages.ownerRoleRequiresOwnerRelationship ?? 'Resident Role Owner can only use Resident Type Owner.'
        }

        if (validationKey === 'validation_non_owner_role_cannot_use_owner_relationship') {
            return messages.nonOwnerRoleCannotUseOwnerRelationship ?? 'Non-owner Resident Roles cannot use Resident Type Owner.'
        }

        if (validationKey === 'validation_invalid_role_relationship_mapping') {
            return messages.invalidRoleRelationshipMapping ?? 'Resident Type is invalid for the selected Resident Role.'
        }

        return null
    }, [messages.invalidRoleRelationshipMapping, messages.nonOwnerRoleCannotUseOwnerRelationship, messages.ownerRoleRequiresOwnerRelationship])

    const syncRelationshipByRole = useCallback((role: string, relationship?: string) => {
        // Owner role always forces the Owner relationship code. For every other role, keep the
        // resident's current pick — unless it still holds the Owner code from a previous Owner
        // selection, in which case it must be cleared so the resident picks an explicit type.
        const roleIsOwner = isOwnerCodeValue(role, residentRoleOptions)
        const ownerRelationshipValue = findOwnerCodeValue(relationshipOptions)
        const normalizedRelationship = roleIsOwner
            ? ownerRelationshipValue
            : (relationship && relationship.toUpperCase() === ownerRelationshipValue.toUpperCase() ? '' : (relationship ?? ''))

        setValue('apartmentRelationship', normalizedRelationship, { shouldDirty: true, shouldValidate: true })
        setValue('apartmentRelationshipLabel', optionLabelForValue(normalizedRelationship, relationshipOptions), { shouldDirty: true })

        return normalizedRelationship
    }, [relationshipOptions, residentRoleOptions, setValue])

    const validateCurrentRoleRelationship = useCallback((role: string, relationship: string) => {
        const validationKey = getRoleRelationshipValidationKey(role, relationship, residentRoleOptions, relationshipOptions)

        if (!validationKey) {
            clearErrors('apartmentRelationship')
            return true
        }

        setError('apartmentRelationship', {
            type: 'manual',
            message: getRoleRelationshipErrorMessage(validationKey) ?? messages.invalidRoleRelationshipMapping ?? 'Resident Type is invalid for the selected Resident Role.'
        })

        return false
    }, [clearErrors, getRoleRelationshipErrorMessage, messages.invalidRoleRelationshipMapping, relationshipOptions, residentRoleOptions, setError])

    const applyWorkingProject = useCallback((project: WorkingProjectOption | null) => {
        setSelectedApartment(null)
        setValue('apartmentProjectCode', project?.code ?? '', { shouldDirty: true, shouldValidate: true })
        setValue('apartmentProjectId', project ? String(project.id) : '', { shouldDirty: true, shouldValidate: true })
        setValue('apartmentProjectLabel', project ? formatProjectLabel(project) : '', { shouldDirty: true, shouldValidate: true })
        setValue('apartmentCode', '', { shouldDirty: true, shouldValidate: true })
        setValue('apartmentType', '', { shouldDirty: true })
        setValue('apartmentTypeLabel', '', { shouldDirty: true })
        setValue('electricMeterCode', '', { shouldDirty: true })
        setValue('waterMeterCode', '', { shouldDirty: true })
        clearErrors(['apartmentProjectId', 'apartmentProjectCode', 'apartmentProjectLabel', 'apartmentCode', 'residentRole'])
    }, [clearErrors, setValue])

    // Project comes from the working project context only — resident/create no longer lets the
    // user pick a project, so re-applying here on id change is the only way apartmentProjectId/
    // apartmentProjectCode/apartmentProjectLabel and the apartment lookup stay in sync with it.
    useEffect(() => {
        applyWorkingProject(workingProject)
    }, [workingProject?.id])

    // If either code list finishes loading after Owner role was already selected (e.g. a fast
    // click while the fetch was still in flight), re-resolve the forced value against the
    // now-loaded options so it matches the API's exact code casing.
    useEffect(() => {
        if (isOwnerCodeValue(residentRole, residentRoleOptions)) {
            syncRelationshipByRole(residentRole, getValues('apartmentRelationship'))
        }
    }, [relationshipOptions, residentRoleOptions])

    const selectApartment = useCallback((option: ApartmentLookupOption | null) => {
        if (!option) {
            setSelectedApartment(null)
            setValue('apartmentCode', '', { shouldDirty: true, shouldValidate: true })
            setValue('apartmentType', '', { shouldDirty: true })
            setValue('apartmentTypeLabel', '', { shouldDirty: true })
            setValue('electricMeterCode', '', { shouldDirty: true })
            setValue('waterMeterCode', '', { shouldDirty: true })

            return
        }

        setSelectedApartment(option)
        setValue('apartmentCode', option.code, { shouldDirty: true, shouldValidate: true })
        clearErrors('apartmentCode')
        setValue('apartmentType', option.apartmentType ?? '', { shouldDirty: true })
        setValue('apartmentTypeLabel', localizedCatalogLabel(dictionary, option.apartmentType, option.apartmentTypeLabel), { shouldDirty: true })
        setValue('electricMeterCode', option.electricMeterCode ?? '', { shouldDirty: true })
        setValue('waterMeterCode', option.waterMeterCode ?? '', { shouldDirty: true })
        validateCurrentRoleRelationship(getValues('residentRole'), getValues('apartmentRelationship'))
    }, [clearErrors, dictionary, getValues, setValue, validateCurrentRoleRelationship])

    const resetApartmentForm = useCallback(() => {
        setEditingApartmentId(null)
        setSelectedApartment(null)
        setValue('apartmentCode', '', { shouldDirty: true })
        setValue('apartmentType', '', { shouldDirty: true })
        setValue('apartmentTypeLabel', '', { shouldDirty: true })
        setValue('electricMeterCode', '', { shouldDirty: true })
        setValue('waterMeterCode', '', { shouldDirty: true })
        setValue('residentRole', '', { shouldDirty: true })
        setValue('residentRoleLabel', '', { shouldDirty: true })
        setValue('apartmentRelationship', '', { shouldDirty: true })
        setValue('apartmentRelationshipLabel', '', { shouldDirty: true })
        setValue('moveInDate', '', { shouldDirty: true })
        clearErrors([
            'apartmentProjectId',
            'apartmentProjectCode',
            'apartmentProjectLabel',
            'apartmentCode',
            'residentRole',
            'apartmentRelationship'
        ])
    }, [clearErrors, setValue])

    const handleResidentRoleChange = useCallback((role: string) => {
        setValue('residentRole', role, { shouldDirty: true, shouldValidate: true })
        setValue('residentRoleLabel', optionLabelForValue(role, residentRoleOptions), { shouldDirty: true })
        const normalizedRelationship = syncRelationshipByRole(role, getValues('apartmentRelationship'))
        validateCurrentRoleRelationship(role, normalizedRelationship)
    }, [getValues, residentRoleOptions, setValue, syncRelationshipByRole, validateCurrentRoleRelationship])

    const handleApartmentRelationshipChange = useCallback((relationship: string) => {
        setValue('apartmentRelationship', relationship, { shouldDirty: true, shouldValidate: true })
        setValue('apartmentRelationshipLabel', optionLabelForValue(relationship, relationshipOptions), { shouldDirty: true })
        validateCurrentRoleRelationship(getValues('residentRole'), relationship)
    }, [getValues, relationshipOptions, setValue, validateCurrentRoleRelationship])

    const addOrUpdateApartment = useCallback(() => {
        const data = getValues()
        let hasError = false

        if (!data.apartmentProjectCode) {
            setError('apartmentProjectId', {
                type: 'manual',
                message: messages.apartmentRequired ?? 'Project code is required'
            })
            setError('apartmentProjectCode', {
                type: 'manual',
                message: messages.apartmentRequired ?? 'Project code is required'
            })
            setError('apartmentProjectLabel', {
                type: 'manual',
                message: messages.apartmentRequired ?? 'Project code is required'
            })
            hasError = true
        }

        if (!data.apartmentCode) {
            setError('apartmentCode', {
                type: 'manual',
                message: messages.apartmentRequired ?? 'Apartment code is required'
            })
            hasError = true
        }

        if (!data.residentRole) {
            setError('residentRole', {
                type: 'manual',
                message: messages.residentRoleRequired ?? messages.apartmentRequired ?? 'Resident role is required'
            })
            hasError = true
        }

        if (!data.apartmentRelationship) {
            setError('apartmentRelationship', {
                type: 'manual',
                message: messages.apartmentRequired ?? 'Apartment relationship is required'
            })
            hasError = true
        }

        const duplicated = apartments.some(item => item.apartmentCode === data.apartmentCode && item.id !== editingApartmentId)

        if (duplicated) {
            setError('apartmentCode', {
                type: 'manual',
                message: messages.apartmentDuplicated ?? 'Apartment code already exists in the list'
            })
            hasError = true
        }

        if (!validateCurrentRoleRelationship(data.residentRole, data.apartmentRelationship)) {
            hasError = true
        }

        if (hasError) return

        const nextApartment: ResidentApartmentFormValue = {
            id: editingApartmentId ?? createRowId(),
            projectCode: data.apartmentProjectCode,
            apartmentCode: data.apartmentCode,
            apartmentType: data.apartmentType,
            apartmentTypeLabel: data.apartmentTypeLabel,
            electricMeterCode: data.electricMeterCode,
            waterMeterCode: data.waterMeterCode,
            hasOwner: selectedApartment?.hasOwner ?? false,
            residentRole: data.residentRole,
            residentRoleLabel: optionLabelForValue(data.residentRole, residentRoleOptions) || data.residentRoleLabel,
            apartmentRelationship: data.apartmentRelationship,
            apartmentRelationshipLabel: optionLabelForValue(data.apartmentRelationship, relationshipOptions) || data.apartmentRelationshipLabel,
            moveInDate: data.moveInDate,
            selectedApartment
        }

        setApartments(current => (
            editingApartmentId
                ? current.map(item => (item.id === editingApartmentId ? nextApartment : item))
                : [...current, nextApartment]
        ))
        setIsAppAccountLocked(true)
        resetApartmentForm()

        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
        setHighlightedApartmentId(nextApartment.id)
        highlightTimeoutRef.current = setTimeout(() => setHighlightedApartmentId(null), 1600)
    }, [apartments, editingApartmentId, getValues, messages.apartmentDuplicated, messages.apartmentRequired, messages.residentRoleRequired, relationshipOptions, residentRoleOptions, resetApartmentForm, selectedApartment, setError, validateCurrentRoleRelationship])

    const editApartment = useCallback((row: ResidentApartmentFormValue) => {
        setEditingApartmentId(row.id)
        setSelectedApartment(row.selectedApartment)
        setValue('apartmentProjectCode', row.projectCode, { shouldDirty: true, shouldValidate: true })
        setValue('apartmentProjectId', workingProject ? String(workingProject.id) : '', { shouldDirty: true })
        setValue('apartmentProjectLabel', workingProject ? formatProjectLabel(workingProject) : row.projectCode, { shouldDirty: true })
        setValue('apartmentCode', row.apartmentCode, { shouldDirty: true, shouldValidate: true })
        setValue('apartmentType', row.apartmentType, { shouldDirty: true })
        setValue('apartmentTypeLabel', localizedCatalogLabel(dictionary, row.apartmentType, row.apartmentTypeLabel), { shouldDirty: true })
        setValue('electricMeterCode', row.electricMeterCode, { shouldDirty: true })
        setValue('waterMeterCode', row.waterMeterCode, { shouldDirty: true })
        // Resolve both codes case-insensitively against their loaded code lists so a previously
        // saved value like "owner" still matches the canonical "Owner" option in each Select.
        const role = resolveOptionValue(row.residentRole, residentRoleOptions)
        setValue('residentRole', role, { shouldDirty: true, shouldValidate: true })
        setValue('residentRoleLabel', optionLabelForValue(role, residentRoleOptions) || row.residentRoleLabel || role, { shouldDirty: true })
        const relationship = resolveOptionValue(row.apartmentRelationship, relationshipOptions)
        setValue('apartmentRelationship', relationship, { shouldDirty: true, shouldValidate: true })
        setValue('apartmentRelationshipLabel', optionLabelForValue(relationship, relationshipOptions) || row.apartmentRelationshipLabel || relationship, { shouldDirty: true })
        setValue('moveInDate', row.moveInDate, { shouldDirty: true })
    }, [dictionary, relationshipOptions, residentRoleOptions, workingProject, setValue])

    const removeApartment = useCallback((id: string) => {
        setApartments(current => current.filter(item => item.id !== id))
        if (editingApartmentId === id) resetApartmentForm()
    }, [editingApartmentId, resetApartmentForm])

    const generatePassword = useCallback(() => {
        if (is_app_account_locked) return

        setValue('password', generateStrongPassword(), { shouldDirty: true, shouldValidate: true })
    }, [is_app_account_locked, setValue])

    const resetForm = useCallback(() => {
        setApartments([])
        setSelectedApartment(null)
        setEditingApartmentId(null)
        setIsAppAccountLocked(false)
        setCreatedResidentActivation(null)
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
        setHighlightedApartmentId(null)
        reset(DEFAULT_RESIDENT_PROFILE_FORM_VALUES)
        applyWorkingProject(workingProject)
    }, [applyWorkingProject, reset, workingProject])

    const closeActivationQrDialog = useCallback(() => {
        setCreatedResidentActivation(null)

        if (onCreateSuccess) {
            onCreateSuccess()
            return
        }

        resetForm()
    }, [onCreateSuccess, resetForm])

    const onSubmit = useCallback(async (data: ResidentProfileFormValues) => {
        const phoneNumber = normalizeText(data.phoneNumber)
        const email = normalizeText(data.email)

        if (!phoneNumber) {
            setError('phoneNumber', {
                type: 'manual',
                message: messages.phoneRequired ?? 'Please enter a phone number.'
            })
            return
        }

        if (!email) {
            setError('email', {
                type: 'manual',
                message: messages.emailRequired ?? 'Please enter an email.'
            })
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('email', {
                type: 'manual',
                message: messages.invalidEmail ?? 'Email format is invalid.'
            })
            return
        }

        if (apartments.length === 0) {
            SwalAlert('warning', messages.apartmentListRequired ?? 'Please add at least one apartment before saving.', 'center')
            return
        }

        const apartmentMissingRequiredFields = apartments.find(apartment => (
            !normalizeText(apartment.projectCode)
            || !normalizeText(apartment.apartmentCode)
            || !normalizeText(apartment.apartmentRelationship)
        ))

        if (apartmentMissingRequiredFields) {
            SwalAlert('warning', messages.apartmentRequired ?? 'Apartment information is required', 'center')
            return
        }

        if (apartments.some(apartment => !normalizeText(apartment.residentRole))) {
            SwalAlert('warning', messages.residentRoleRequired ?? 'Resident role is required', 'center')
            return
        }

        const invalidRoleRelationship = apartments
            .map(item => getRoleRelationshipValidationKey(item.residentRole, item.apartmentRelationship, residentRoleOptions, relationshipOptions))
            .find(Boolean) ?? null

        if (invalidRoleRelationship) {
            SwalAlert(
                'warning',
                getRoleRelationshipErrorMessage(invalidRoleRelationship) ?? messages.invalidRoleRelationshipMapping ?? 'Resident Type is invalid for the selected Resident Role.',
                'center'
            )
            return
        }

        setSaving(true)

        try {
            const payload = buildCreateResidentProfilePayload(data, apartments)
            const response = await residentService.createResidentProfile(payload, {
                sessiontoken: session?.user?.token as string,
                language
            })

            const responsePayload = response.payload

            if (response.status < 200 || response.status >= 300 || residentHierarchyMapper.hasBusinessError(responsePayload)) {
                SwalAlert('error', residentHierarchyMapper.getErrorMessage(responsePayload, messages.failure), 'center')
                return
            }

            setCreatedResidentActivation({
                activation_code: residentHierarchyMapper.getActivationCode(response),
                username: payload.app_account.username,
                password: payload.app_account.password
            })
        } catch (error: any) {
            SwalAlert('error', error?.message ?? messages.failure, 'center')
        } finally {
            setSaving(false)
        }
    }, [apartments, getRoleRelationshipErrorMessage, language, messages.apartmentListRequired, messages.apartmentRequired, messages.emailRequired, messages.failure, messages.invalidEmail, messages.invalidRoleRelationshipMapping, messages.phoneRequired, messages.residentRoleRequired, relationshipOptions, residentRoleOptions, session, setError])

    const submitProfile = useCallback(async () => {
        const isProfileValid = await trigger([
            'fullName',
            'phoneNumber',
            'email',
            'gender',
            'username'
        ])

        if (!isProfileValid) return

        await onSubmit(getValues())
    }, [getValues, onSubmit, trigger])

    return {
        form,
        saving,
        apartments,
        editingApartmentId,
        isApartmentRelationshipLocked,
        is_app_account_locked,
        created_resident_activation,
        highlightedApartmentId,
        showPassword,
        resetForm,
        closeActivationQrDialog,
        onSubmit,
        submitProfile,
        selectApartment,
        handleResidentRoleChange,
        handleApartmentRelationshipChange,
        addOrUpdateApartment,
        editApartment,
        removeApartment,
        resetApartmentForm,
        generatePassword,
        togglePasswordVisibility: () => setShowPassword(value => !value)
    }
}
