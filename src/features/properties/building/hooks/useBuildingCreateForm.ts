'use client'

import { useAdminPropertyContext } from '@/features/properties/PropertyRouteContext'
import { propertyPath } from '@/features/properties/propertyPaths'

import { useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@shared/utils/SwalAlert'

import { buildBuildingCreatePayload, buildingText, emptyBuildingCreateValues, validateBuildingCreate } from '../buildingHelpers'
import type { BuildingCreateErrorKey } from '../buildingHelpers'
import { buildingService } from '../buildingService'
import type { BuildingCreateFormValues, BuildingDictionary } from '../types'

export const BUILDING_CREATE_ERROR_MESSAGES: Record<BuildingCreateErrorKey, [key: string, fallback: string]> = {
  building_code: ['buildingCodeRequired', 'Tower code is required.'],
  name: ['buildingNameRequired', 'Tower name is required.'],
  floor_count: ['floorCountInvalid', 'Floor count must be a whole number.'],
  resident_count: ['residentCountInvalid', 'Resident count must be a whole number of 0 or more.']
}

/**
 * Create Tower page state (/properties/building/create). The project is the working project (project context),
 * sent as project_id. Submits WF_BO_CREATE_BUILDING; on error the page and the typed values are kept.
 */
export function useBuildingCreateForm({
  dictionary,
  sessiontoken,
  locale
}: {
  dictionary: BuildingDictionary
  sessiontoken?: string
  locale: Locale
}) {
  const router = useRouter()
  const admin = useAdminPropertyContext()
  const project = useWorkingProject()
  const projectId = project?.id ?? null

  const [values, setValues] = useState<BuildingCreateFormValues>(emptyBuildingCreateValues)
  const [errors, setErrors] = useState<Partial<Record<BuildingCreateErrorKey, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const errorText = (key: BuildingCreateErrorKey) => buildingText(dictionary, BUILDING_CREATE_ERROR_MESSAGES[key][0], BUILDING_CREATE_ERROR_MESSAGES[key][1])

  const updateValue = <K extends keyof BuildingCreateFormValues>(key: K, value: BuildingCreateFormValues[K]) => {
    setSubmitError(null)
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const backToList = () => router.push(`/${locale}${propertyPath('building', admin)}`)

  const submit = async () => {
    if (saving) return

    const invalid = validateBuildingCreate(values)

    setErrors(Object.fromEntries(invalid.map(key => [key, errorText(key)])))
    if (invalid.length > 0 || !projectId) return

    setSaving(true)
    setSubmitError(null)

    try {
      const createdId = await buildingService.createBuilding({
        sessiontoken,
        language: locale,
        payload: buildBuildingCreatePayload(projectId, values)
      })

      SwalAlert('success', buildingText(dictionary, 'createBuildingSuccess', 'Tower created successfully.'), 'center')
      router.push(!admin && createdId ? `/${locale}${propertyPath('building', admin)}/${createdId}` : `/${locale}${propertyPath('building', admin)}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : buildingText(dictionary, 'createBuildingFailed', 'Unable to create tower.'))
    } finally {
      setSaving(false)
    }
  }

  return { project, values, errors, submitError, saving, updateValue, backToList, submit }
}
