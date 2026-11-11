'use client'

import { useAdminPropertyContext } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useEffect, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@shared/utils/SwalAlert'

import { apartmentText } from '../apartmentHelpers'
import {
  buildApartmentCreateRequest,
  emptyApartmentCreateValues,
  getGeneratedApartmentCode,
  isCustomApartmentCodeMissing,
  resolveApartmentCodeInput,
  resolveApartmentFloorNo,
  validateApartmentCreate
} from '../apartmentCreateHelpers'
import type { ApartmentCreateErrorKey } from '../apartmentCreateHelpers'
import { apartmentSearchService } from '../services/apartmentSearchService'
import type { ApartmentCreateFormValues, ApartmentDictionary } from '../types'
import { useApartmentLocationOptions } from './useApartmentLocationOptions'

export const APARTMENT_FORM_ERROR_MESSAGES: Record<ApartmentCreateErrorKey, [key: string, fallback: string]> = {
  project: ['projectRequired', 'Project is required.'],
  building_id: ['buildingRequired', 'Tower is required.'],
  building_code: ['buildingCodeMissing', 'The selected tower has no tower code.'],
  floor_id: ['floorRequired', 'Floor is required.'],
  floor_no: ['floorNoUnresolved', 'The floor number of this floor could not be determined.'],
  unit_number: ['apartmentNoRequired', 'Apartment no is required.'],
  area: ['areaMustBeNumber', 'Area must be a valid number.'],
  room_count: ['roomCountInvalid', 'Room count must be a whole number.'],
  status: ['apartmentStatusRequired', 'Status is required.'],
  apartment_code: ['apartmentCodeRequired', 'Full apartment code is required.']
}

/**
 * Create Apartment page state. The project is the working project (locked by the project context);
 * towers and floors cascade from the real search workflows. Submits WF_BO_CREATE_APARTMENT.
 */
export function useApartmentCreateForm({
  dictionary,
  sessiontoken,
  locale
}: {
  dictionary: ApartmentDictionary
  sessiontoken?: string
  locale: Locale
}) {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const project = useWorkingProject()
  const projectId = project?.id ?? null

  const [values, setValues] = useState<ApartmentCreateFormValues>(emptyApartmentCreateValues)
  // Full code mode: null = auto (follows the formula), string = custom code typed by the user (never overwritten).
  const [customApartmentCode, setCustomApartmentCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<ApartmentCreateErrorKey, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const location = useApartmentLocationOptions({ dictionary, sessiontoken, locale, projectId })

  const selectedBuilding = location.buildingOptions.find(building => building.id === values.building_id) ?? null
  const selectedFloor = location.floorOptions.find(floor => floor.id === values.floor_id) ?? null
  // Live formula code (Tower – Floor – Unit); recomputed on every tower / floor / unit number change.
  const generatedApartmentCode = getGeneratedApartmentCode(selectedBuilding, selectedFloor, values.unit_number)
  // Shown in the field: the custom code when the user typed one, else the formula code.
  const apartmentCode = resolveApartmentCodeInput(customApartmentCode, generatedApartmentCode)
  const apartmentCodeCustom = customApartmentCode !== null

  // Project changed (or first load): clear tower/floor (their options reload in useApartmentLocationOptions).
  useEffect(() => {
    let current = true

    Promise.resolve().then(() => {
      if (current) setValues(existing => ({ ...existing, building_id: null, floor_id: null }))
    })

    return () => { current = false }
  }, [projectId])

  const errorText = (key: ApartmentCreateErrorKey) => apartmentText(dictionary, APARTMENT_FORM_ERROR_MESSAGES[key][0], APARTMENT_FORM_ERROR_MESSAGES[key][1])

  const updateValue = <K extends keyof ApartmentCreateFormValues>(key: K, value: ApartmentCreateFormValues[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined, ...(key === 'floor_id' ? { floor_no: undefined } : {}) }))
  }

  /** Typing the full code switches to custom mode: tower / floor / unit changes no longer overwrite it. */
  const changeApartmentCode = (value: string) => {
    setSubmitError(null)
    setCustomApartmentCode(value)
    setErrors(current => ({ ...current, apartment_code: undefined }))
  }

  /** Back to auto mode: the field shows (and follows) the formula code again. */
  const restoreApartmentCode = () => {
    setSubmitError(null)
    setCustomApartmentCode(null)
    setErrors(current => ({ ...current, apartment_code: undefined }))
  }

  /** Tower changed: clear the floor (and its floor_no) and load the tower's floors. */
  const changeBuilding = async (buildingId: number | null) => {
    setSubmitError(null)
    setValues(current => ({ ...current, building_id: buildingId, floor_id: null }))
    setErrors(current => ({ ...current, building_id: undefined, building_code: undefined, floor_id: undefined, floor_no: undefined }))
    await location.loadFloors(buildingId)
  }

  const backToList = () => router.push(`/${locale}${propertyPath('unit', admin)}`)

  const submit = async () => {
    if (saving) return

    const invalid = validateApartmentCreate(projectId, values, selectedBuilding, selectedFloor)

    if (isCustomApartmentCodeMissing(customApartmentCode)) invalid.push('apartment_code')

    setErrors(Object.fromEntries(invalid.map(key => [key, errorText(key)])))
    if (invalid.length > 0 || !projectId) return

    const buildingCode = selectedBuilding?.building_code?.trim() ?? ''
    const floorNo = resolveApartmentFloorNo(selectedFloor)

    if (!buildingCode || !floorNo || !apartmentCode.trim()) return

    setSaving(true)
    setSubmitError(null)

    try {
      const createdId = await apartmentSearchService.createApartment({
        sessiontoken,
        language: locale,
        // The shown code as is (custom or auto) — never regenerated here.
        request: buildApartmentCreateRequest(projectId, values, { buildingCode, floorNo, apartmentCode })
      })

      SwalAlert('success', apartmentText(dictionary, 'createApartmentSuccess', 'Apartment created successfully.'), 'center')
      router.push(!admin && createdId ? `/${locale}${propertyPath('unit', admin)}/${createdId}` : `/${locale}${propertyPath('unit', admin)}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : apartmentText(dictionary, 'createApartmentFailed', 'Unable to create apartment.'))
    } finally {
      setSaving(false)
    }
  }

  return {
    project,
    values,
    apartmentCode,
    apartmentCodeCustom,
    errors,
    submitError,
    saving,
    buildingOptions: location.buildingOptions,
    buildingsLoading: location.buildingsLoading,
    floorOptions: location.floorOptions,
    floorsLoading: location.floorsLoading,
    optionsError: location.optionsError,
    updateValue,
    changeBuilding,
    changeApartmentCode,
    restoreApartmentCode,
    backToList,
    submit
  }
}
