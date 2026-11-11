import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { floorText, resolveFloorContractFields } from '../floorHelpers'
import { floorService } from '../floorService'
import type { FloorBuildingOption, FloorDetailModel, FloorDictionary } from '../types'

export type FloorFormMode = 'create' | 'edit'

export type FloorFormValues = {
  building_id: number | null
  floor_code: string
  name: string
  description: string
  /** Edit only. */
  status: string
}

type FieldErrors = Partial<Record<keyof FloorFormValues, string>>

const emptyValues: FloorFormValues = { building_id: null, floor_code: '', name: '', description: '', status: '' }

/**
 * Create/Edit floor dialog state. The form edits Tower, Floor code, Floor name (+ Status on edit); the
 * Backend-required floor_no / display_order are not shown and come from resolveFloorContractFields:
 * derived from the floor code on create (and on edit when the code changes), otherwise the stored values.
 * Errors stay inside the dialog and the dialog stays open on failure.
 */
export function useFloorForm({
  dictionary,
  sessiontoken,
  language,
  onSaved
}: {
  dictionary: FloorDictionary
  sessiontoken?: string
  language: Locale
  onSaved: (mode: FloorFormMode) => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<FloorFormMode>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [original, setOriginal] = useState<Pick<FloorDetailModel, 'floor_code' | 'floor_no' | 'display_order' | 'resident_count'> | null>(null)
  const [values, setValues] = useState<FloorFormValues>(emptyValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [buildingOptions, setBuildingOptions] = useState<FloorBuildingOption[]>([])
  const [buildingsError, setBuildingsError] = useState<string | null>(null)

  const reset = () => {
    setErrors({})
    setSubmitError(null)
    setBuildingsError(null)
  }

  /** `buildingId` is the tower currently managed on the list page (preselected when present). */
  const openCreate = (buildingId: number | null, options: FloorBuildingOption[]) => {
    reset()
    setMode('create')
    setEditingId(null)
    setOriginal(null)
    setBuildingOptions(options)
    setValues({ ...emptyValues, building_id: buildingId })
    setOpen(true)
  }

  const openEdit = (floor: FloorDetailModel) => {
    reset()
    setMode('edit')
    setEditingId(floor.id)
    setOriginal({
      floor_code: floor.floor_code,
      floor_no: floor.floor_no,
      display_order: floor.display_order,
      resident_count: floor.resident_count
    })
    setBuildingOptions([])
    setValues({
      building_id: floor.building_id || null,
      floor_code: floor.floor_code,
      name: floor.name,
      description: floor.description ?? '',
      status: floor.status
    })
    setOpen(true)

    floorService.simpleSearchBuildings({ sessiontoken, language, project_id: floor.project_id })
      .then(setBuildingOptions)
      .catch((error: unknown) => {
        setBuildingsError(error instanceof Error ? error.message : floorText(dictionary, 'loadBuildingsFailed', 'Unable to load buildings.'))
      })
  }

  const close = () => {
    if (saving) return
    setOpen(false)
    setValues(emptyValues)
    reset()
  }

  const updateValue = <K extends keyof FloorFormValues>(key: K, value: FloorFormValues[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const next: FieldErrors = {}

    if (!values.building_id) next.building_id = floorText(dictionary, 'buildingRequired', 'Tower is required.')
    if (!values.floor_code.trim()) {
      next.floor_code = floorText(dictionary, 'floorCodeRequired', 'Floor code is required.')
    } else if (!resolveFloorContractFields(values.floor_code, mode === 'edit' ? original : null)) {
      next.floor_code = floorText(dictionary, 'floorCodeMustEndWithNumber', 'Floor code must end with the floor number, for example: VGP-S1-F15.')
    }
    if (!values.name.trim()) next.name = floorText(dictionary, 'floorNameRequired', 'Floor name is required.')
    if (mode === 'edit' && !values.status) next.status = floorText(dictionary, 'floorStatusRequired', 'Status is required.')

    setErrors(next)

    return Object.keys(next).length === 0
  }

  const submit = async () => {
    if (saving || !validate() || !values.building_id) return

    const contractFields = resolveFloorContractFields(values.floor_code, mode === 'edit' ? original : null)

    if (!contractFields) return

    setSaving(true)
    setSubmitError(null)

    try {
      if (mode === 'create') {
        await floorService.createFloor({
          sessiontoken,
          language,
          payload: {
            building_id: values.building_id,
            floor_code: values.floor_code.trim(),
            name: values.name.trim(),
            floor_no: contractFields.floor_no,
            display_order: contractFields.display_order,
            description: values.description.trim(),
            // Not editable in the form; the API contract still carries the field.
            resident_count: null
          }
        })
      } else if (editingId) {
        await floorService.updateFloor({
          sessiontoken,
          language,
          payload: {
            id: editingId,
            building_id: values.building_id,
            floor_code: values.floor_code.trim(),
            name: values.name.trim(),
            floor_no: contractFields.floor_no,
            display_order: contractFields.display_order,
            description: values.description.trim(),
            // Not editable in the form; keep the stored value so an update never clears it.
            resident_count: original?.resident_count ?? null,
            status: values.status
          }
        })
      }

      setOpen(false)
      setValues(emptyValues)
      reset()
      await onSaved(mode)
    } catch (error) {
      const fallback = mode === 'create'
        ? floorText(dictionary, 'createFloorFailed', 'Unable to create floor.')
        : floorText(dictionary, 'updateFloorFailed', 'Unable to update floor.')

      setSubmitError(error instanceof Error ? error.message : fallback)
    } finally {
      setSaving(false)
    }
  }

  return {
    open,
    mode,
    values,
    errors,
    submitError,
    saving,
    buildingOptions,
    buildingsError,
    openCreate,
    openEdit,
    close,
    updateValue,
    submit
  }
}
