import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import {
  isValidResidentCountInput,
  toResidentCountInput,
  toResidentCountPayload
} from '@/features/properties/propertyFieldHelpers'

import { buildingText, isValidFloorCountInput } from '../buildingHelpers'
import { buildingService } from '../buildingService'
import type { BuildingDetailModel, BuildingDictionary } from '../types'

export type BuildingFormValues = {
  building_code: string
  name: string
  /** Raw input, sent as a string ("" when empty) like the Backend sample; never converted to NaN. */
  floor_count: string
  description: string
  /** Whole number >= 0 or "" (sent as null). */
  resident_count: string
  status: string
}

type FieldErrors = Partial<Record<keyof BuildingFormValues, string>>

const emptyValues: BuildingFormValues = { building_code: '', name: '', floor_count: '', description: '', resident_count: '', status: '' }

/**
 * Edit tower dialog state (create is the /properties/building/create page). Only the contract fields are
 * edited and sent: Update { id, building_code, name, floor_count, display_order, description, resident_count, status }
 * where display_order is the stored value (not edited). Errors stay inside the open dialog.
 */
export function useBuildingForm({
  dictionary,
  sessiontoken,
  language,
  onSaved
}: {
  dictionary: BuildingDictionary
  sessiontoken?: string
  language: Locale
  onSaved: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  // Stored display order of the edited tower, sent back unchanged (not an input).
  const [displayOrder, setDisplayOrder] = useState<number | null>(null)
  const [values, setValues] = useState<BuildingFormValues>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const openEdit = (building: BuildingDetailModel) => {
    setErrors({})
    setSubmitError(null)
    setEditingId(building.id)
    setDisplayOrder(building.display_order)
    setValues({
      building_code: building.building_code,
      name: building.name,
      floor_count: building.floor_count === null ? '' : String(building.floor_count),
      description: building.description ?? '',
      resident_count: toResidentCountInput(building.resident_count),
      status: building.status
    })
    setOpen(true)
  }

  const close = () => {
    if (saving) return
    setOpen(false)
    setValues(emptyValues)
    setErrors({})
    setSubmitError(null)
  }

  const updateValue = <K extends keyof BuildingFormValues>(key: K, value: BuildingFormValues[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const next: FieldErrors = {}

    if (!values.building_code.trim()) next.building_code = buildingText(dictionary, 'buildingCodeRequired', 'Tower code is required.')
    if (!values.name.trim()) next.name = buildingText(dictionary, 'buildingNameRequired', 'Tower name is required.')
    if (!isValidFloorCountInput(values.floor_count)) next.floor_count = buildingText(dictionary, 'floorCountInvalid', 'Floor count must be a whole number.')
    if (!isValidResidentCountInput(values.resident_count)) {
      next.resident_count = buildingText(dictionary, 'residentCountInvalid', 'Resident count must be a whole number of 0 or more.')
    }
    if (!values.status) next.status = buildingText(dictionary, 'buildingStatusRequired', 'Status is required.')

    setErrors(next)

    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (saving || !editingId || !validate()) return

    setSaving(true)
    setSubmitError(null)

    try {
      await buildingService.updateBuilding({
        sessiontoken,
        language,
        payload: {
          id: editingId,
          building_code: values.building_code.trim(),
          name: values.name.trim(),
          floor_count: values.floor_count.trim(),
          display_order: displayOrder,
          description: values.description.trim(),
          resident_count: toResidentCountPayload(values.resident_count),
          status: values.status
        }
      })

      setOpen(false)
      setValues(emptyValues)
      await onSaved()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : buildingText(dictionary, 'updateBuildingFailed', 'Unable to update tower.'))
    } finally {
      setSaving(false)
    }
  }

  return { open, values, errors, submitError, saving, openEdit, close, updateValue, submit }
}
