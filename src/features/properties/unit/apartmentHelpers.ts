import type { ChipProps } from '@mui/material/Chip'

import type {
  ApartmentBuildingOption,
  ApartmentDictionary,
  ApartmentFloorOption,
  ApartmentProjectOption,
  ApartmentSearchFilter,
  ApartmentStatusFilter
} from './types'

export const emptyApartmentFilter: ApartmentSearchFilter = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  project_id: null,
  building_id: null,
  floor_id: null,
  status: 'all',
  qr_payment_enabled: 'all'
}

// Record active-status of the apartment itself (A/I/D), not an occupancy status.
// "D" (Deleted) is intentionally not selectable on screen (filter or edit form).
export const apartmentStatusOptions: ApartmentStatusFilter[] = ['all', 'A', 'I']

export const apartmentText = (dictionary: ApartmentDictionary, key: string, fallback: string) => (
  (dictionary as any).propertyManagement?.[key] ?? fallback
)

export const commonText = (dictionary: ApartmentDictionary, key: string, fallback: string) => (
  (dictionary as any).common?.[key] ?? fallback
)

export const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const formatNumber = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
}

export const getApartmentRecordStatusLabel = (dictionary: ApartmentDictionary, status: string) => {
  const key = `status${status.toUpperCase()}`

  return apartmentText(dictionary, key, status || '-')
}

export const getApartmentRecordStatusColor = (status: string): ChipProps['color'] => {
  const value = status.toUpperCase()

  if (value === 'A') return 'success'
  if (value === 'D') return 'error'
  if (value === 'I') return 'default'

  return 'default'
}

/** Area (m²): a plain non-negative decimal — no unit, sign, exponent or thousand separator. */
const AREA_PATTERN = /^(\d+(\.\d+)?|\.\d+)$/

/** Optional area: empty is valid; otherwise a non-negative decimal (kept as typed, never rounded). */
export const isValidAreaInput = (value: string) => value.trim() === '' || AREA_PATTERN.test(value.trim())

/** Keystroke filter for area inputs: digits with at most one decimal point (rejects "abc", "50m2", "50 m²"). */
export const isAreaDraftInput = (value: string) => /^\d*\.?\d*$/.test(value)

/** Display-only: "55.5 m²"; the raw Backend value is never modified. */
export const formatApartmentArea = (value: number | string | null | undefined) => (
  value === null || value === undefined || String(value).trim() === '' ? '-' : `${value} m²`
)

export const resolveProjectLabel = (options: ApartmentProjectOption[], projectId: number) => {
  const found = options.find(option => option.id === projectId)

  if (!found) return String(projectId)

  return found.code ? `[${found.code}] ${found.name}` : found.name
}

/** Tower option label: "[code] name" (like formatProjectLabel); just one of them when the other is missing or identical. */
export const formatApartmentBuildingLabel = (building: Pick<ApartmentBuildingOption, 'building_code' | 'name'>) => {
  const code = building.building_code?.trim() ?? ''
  const name = building.name?.trim() ?? ''

  return code && name && code !== name ? `[${code}] ${name}` : name || code || '-'
}

/** Floor option label: floor name, else floor code — never floor_no (can be a wrong 0, e.g. code "01"). */
export const formatApartmentFloorLabel = (floor: Pick<ApartmentFloorOption, 'name' | 'floor_code'>) => (
  floor.name?.trim() || floor.floor_code?.trim() || '-'
)

export const resolveBuildingLabel = (options: ApartmentBuildingOption[], buildingId: number) => {
  const found = options.find(option => option.id === buildingId)

  return found ? found.name : String(buildingId)
}
