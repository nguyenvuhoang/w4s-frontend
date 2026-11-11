'use client'

import { useAdminPropertyContext } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@shared/utils/SwalAlert'

import { apartmentText } from '../apartmentHelpers'
import {
  buildApartmentCode,
  getInitialCustomApartmentCode,
  isCustomApartmentCodeMissing,
  resolveApartmentCodeInput
} from '../apartmentCreateHelpers'
import {
  buildApartmentEditValues,
  buildApartmentUpdateRequest,
  resolveApartmentEditBuildingCode,
  resolveApartmentEditFloorNo,
  validateApartmentEdit
} from '../apartmentEditHelpers'
import type { ApartmentEditErrorKey } from '../apartmentEditHelpers'
import { apartmentSearchService } from '../services/apartmentSearchService'
import type { ApartmentDetailApartment, ApartmentDictionary, ApartmentEditFormValues } from '../types'
import { APARTMENT_FORM_ERROR_MESSAGES } from './useApartmentCreateForm'
import { useApartmentLocationOptions } from './useApartmentLocationOptions'

const ERROR_MESSAGES: Record<ApartmentEditErrorKey, [key: string, fallback: string]> = APARTMENT_FORM_ERROR_MESSAGES

/**
 * Edit Apartment page state, pre-filled from WF_BO_GET_APARTMENT_DETAIL (loaded by the route). Towers and
 * floors cascade from the apartment's own project like on create. Submits WF_BO_UPDATE_APARTMENT, then
 * returns to the detail page, which reloads the Backend data.
 */
export function useApartmentEditForm({
  dictionary,
  sessiontoken,
  locale,
  apartment
}: {
  dictionary: ApartmentDictionary
  sessiontoken?: string
  locale: Locale
  apartment: ApartmentDetailApartment
}) {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const projectId = apartment.project_id || null

  const [values, setValues] = useState<ApartmentEditFormValues>(() => buildApartmentEditValues(apartment))
  // Full code mode: a stored code that differs from the formula opens as custom (shown unchanged); else auto (null).
  const [customApartmentCode, setCustomApartmentCode] = useState<string | null>(() => getInitialCustomApartmentCode(apartment))
  const [errors, setErrors] = useState<Partial<Record<ApartmentEditErrorKey, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const location = useApartmentLocationOptions({ dictionary, sessiontoken, locale, projectId, initialBuildingId: apartment.building_id || null })

  const selectedBuilding = location.buildingOptions.find(building => building.id === values.building_id) ?? null
  const selectedFloor = location.floorOptions.find(floor => floor.id === values.floor_id) ?? null
  // Unchanged tower/floor keep the stored code parts (apartment.floor "01", not the floor record's floor_no 0).
  const buildingCode = resolveApartmentEditBuildingCode(apartment, values.building_id, selectedBuilding)
  const floorNo = resolveApartmentEditFloorNo(apartment, values.floor_id, selectedFloor)
  // Live formula code (Tower – Floor – Unit); recomputed on every tower / floor / unit number change.
  const generatedApartmentCode = buildApartmentCode({ buildingCode, floorNo, unitNumber: values.unit_number })
  // Shown in the field: the custom code (stored or typed), else the formula code.
  const apartmentCode = resolveApartmentCodeInput(customApartmentCode, generatedApartmentCode)
  const apartmentCodeCustom = customApartmentCode !== null
  const optionsLoading = location.buildingsLoading || location.floorsLoading

  const errorText = (key: ApartmentEditErrorKey) => apartmentText(dictionary, ERROR_MESSAGES[key][0], ERROR_MESSAGES[key][1])

  const updateValue = <K extends keyof ApartmentEditFormValues>(key: K, value: ApartmentEditFormValues[K]) => {
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

  const backToDetail = () => router.push(`/${locale}${propertyPath('unit', admin)}/${apartment.id}`)

  const submit = async () => {
    if (saving || optionsLoading) return

    const invalid = validateApartmentEdit(projectId, values, { buildingCode, floorNo })

    if (isCustomApartmentCodeMissing(customApartmentCode)) invalid.push('apartment_code')

    setErrors(Object.fromEntries(invalid.map(key => [key, errorText(key)])))
    if (invalid.length > 0) return
    if (!buildingCode || !floorNo || !apartmentCode.trim()) return

    setSaving(true)
    setSubmitError(null)

    try {
      await apartmentSearchService.updateApartment({
        sessiontoken,
        language: locale,
        // The shown code as is (custom or auto) — never regenerated here.
        request: buildApartmentUpdateRequest(apartment.id, values, { buildingCode, floorNo, apartmentCode }, {
          water_meter_code2: apartment.water_meter_code2,
          electric_meter_code: apartment.electric_meter_code
        })
      })

      SwalAlert('success', apartmentText(dictionary, 'updateApartmentSuccess', 'Apartment updated successfully.'), 'center')
      if (admin) router.push(`/${locale}${propertyPath('unit', admin)}`)
      else backToDetail()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : apartmentText(dictionary, 'updateApartmentFailed', 'Unable to update apartment.'))
    } finally {
      setSaving(false)
    }
  }

  return {
    values,
    apartmentCode,
    apartmentCodeCustom,
    errors,
    submitError,
    saving,
    optionsLoading,
    buildingOptions: location.buildingOptions,
    buildingsLoading: location.buildingsLoading,
    floorOptions: location.floorOptions,
    floorsLoading: location.floorsLoading,
    optionsError: location.optionsError,
    updateValue,
    changeBuilding,
    changeApartmentCode,
    restoreApartmentCode,
    backToDetail,
    submit
  }
}
