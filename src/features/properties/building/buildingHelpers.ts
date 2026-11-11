import type { ChipProps } from '@mui/material/Chip'

import { isValidResidentCountInput, toResidentCountPayload } from '@/features/properties/propertyFieldHelpers'

import type {
  BuildingCreateFormValues,
  BuildingCreatePayload,
  BuildingDictionary,
  BuildingSearchFilter,
  BuildingStatusFilter
} from './types'

export const emptyBuildingFilter: BuildingSearchFilter = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  project_id: null,
  status: ''
}

export const BUILDING_STATUS_FILTER_OPTIONS: BuildingStatusFilter[] = ['', 'A', 'I']

// Statuses selectable when editing a tower (Active / Inactive).
export const BUILDING_EDIT_STATUS_OPTIONS = ['A', 'I']

// Changing the status filter reloads from the first page (UI page 1 = request page_index 0), keeping
// the search text, page size and project context.
export const withBuildingStatus = (filter: BuildingSearchFilter, status: BuildingStatusFilter): BuildingSearchFilter => ({
  ...filter,
  status,
  page_index: 1
})

/** Floor count input: empty, or a whole number (keeps the value as the string sent to the workflow). */
export const isValidFloorCountInput = (value: string) => value.trim() === '' || /^\d+$/.test(value.trim())

export const emptyBuildingCreateValues: BuildingCreateFormValues = {
  building_code: '',
  name: '',
  floor_count: '',
  resident_count: '',
  description: ''
}

export type BuildingCreateErrorKey = 'building_code' | 'name' | 'floor_count' | 'resident_count'

/** Invalid Create fields: code / name required, floor count and resident count empty or whole numbers >= 0. */
export const validateBuildingCreate = (values: BuildingCreateFormValues): BuildingCreateErrorKey[] => {
  const invalid: BuildingCreateErrorKey[] = []

  if (!values.building_code.trim()) invalid.push('building_code')
  if (!values.name.trim()) invalid.push('name')
  if (!isValidFloorCountInput(values.floor_count)) invalid.push('floor_count')
  if (!isValidResidentCountInput(values.resident_count)) invalid.push('resident_count')

  return invalid
}

/**
 * WF_BO_CREATE_BUILDING payload. project_id is the working project; text is trimmed; floor_count stays the
 * trimmed string ("" when empty) like the Backend sample; resident_count is a number (0 stays 0) or null.
 */
export const buildBuildingCreatePayload = (projectId: number, values: BuildingCreateFormValues): BuildingCreatePayload => ({
  project_id: projectId,
  building_code: values.building_code.trim(),
  name: values.name.trim(),
  floor_count: values.floor_count.trim(),
  description: values.description.trim(),
  resident_count: toResidentCountPayload(values.resident_count)
})

export const buildingText = (dictionary: BuildingDictionary, key: string, fallback: string) => (
  dictionary.propertyManagement?.[key] ?? fallback
)

export const commonText = (dictionary: BuildingDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const formatNumber = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
}

export const getBuildingStatusFilterLabel = (dictionary: BuildingDictionary, status: BuildingStatusFilter) => (
  status === '' ? buildingText(dictionary, 'buildingStatusAll', 'All') : getBuildingStatusLabel(dictionary, status)
)

export const getBuildingStatusLabel = (dictionary: BuildingDictionary, status: string) => {
  if (status === 'A') return buildingText(dictionary, 'statusA', 'Đang hoạt động')
  if (status === 'I') return buildingText(dictionary, 'statusI', 'Ngưng hoạt động')
  if (status === 'B') return buildingText(dictionary, 'statusB', 'Blocked')
  if (status === 'DRAFT') return buildingText(dictionary, 'statusDRAFT', 'Draft')

  return status || '-'
}

export const getBuildingStatusColor = (status: string): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'error'
  if (status === 'B') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}
