import type { ChipProps } from '@mui/material/Chip'

import type { FloorBuildingOption, FloorDictionary, FloorSearchFilter, FloorStatusFilter } from './types'

export const emptyFloorFilter: FloorSearchFilter = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  status: '',
  project_id: null,
  building_id: null
}

export const FLOOR_STATUS_FILTER_OPTIONS: FloorStatusFilter[] = ['', 'A', 'I']

// Statuses selectable when editing a floor (Active / Inactive).
export const FLOOR_EDIT_STATUS_OPTIONS = ['A', 'I']

// Changing the status filter goes back to the first page (UI page 1 = request page_index 0) and keeps
// the search text, page size and project/tower context.
export const withFloorStatus = (filter: FloorSearchFilter, status: FloorStatusFilter): FloorSearchFilter => ({
  ...filter,
  status,
  page_index: 1
})

/**
 * Tower to restore from the URL context (`?project_id=&building_id=`, set by the Floor detail when going
 * back to the list): only when it belongs to the working project and is one of its loaded towers.
 */
export const resolvePreferredFloorBuildingId = (
  preferred: { project_id: number | null; building_id: number | null } | null | undefined,
  workingProjectId: number,
  options: Pick<FloorBuildingOption, 'id'>[]
): number | null => {
  const building_id = preferred?.building_id

  if (!building_id || preferred?.project_id !== workingProjectId) return null

  return options.some(option => option.id === building_id) ? building_id : null
}

export const floorText = (dictionary: FloorDictionary, key: string, fallback: string) => (
  dictionary.propertyManagement?.[key] ?? fallback
)

export const commonText = (dictionary: FloorDictionary, key: string, fallback: string) => (
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

export type FloorContractFields = { floor_no: string; display_order: number }

/**
 * Confirmed business rule: the floor number is the run of digits at the END of the floor code, and the
 * display order is that number parsed as an integer.
 *   VGP-S1-F15 -> { floor_no: "15", display_order: 15 }
 *   VGP-S1-F01 -> { floor_no: "01", display_order: 1 }
 *   FLOOR-20   -> { floor_no: "20", display_order: 20 }
 * Returns null when the code does not end with digits (the form then blocks the submit).
 */
export const deriveFloorContractFields = (floorCode: string): FloorContractFields | null => {
  const match = /(\d+)$/.exec(floorCode.trim())

  if (!match) return null

  const display_order = Number.parseInt(match[1], 10)

  return Number.isFinite(display_order) ? { floor_no: match[1], display_order } : null
}

/**
 * Update: keep the values the Backend returned while the floor code is unchanged; re-derive both as soon
 * as the code changes (or when the Backend did not return them).
 */
export const resolveFloorContractFields = (
  floorCode: string,
  original?: { floor_code: string; floor_no: string; display_order: number | null } | null
): FloorContractFields | null => {
  if (
    original &&
    floorCode.trim() === original.floor_code.trim() &&
    original.floor_no.trim() !== '' &&
    original.display_order !== null
  ) {
    return { floor_no: original.floor_no, display_order: original.display_order }
  }

  return deriveFloorContractFields(floorCode)
}

export const getFloorStatusFilterLabel = (dictionary: FloorDictionary, status: FloorStatusFilter) => {
  if (status === '') return floorText(dictionary, 'floorStatusAll', 'All')

  return getFloorStatusLabel(dictionary, status)
}

export const displayResidentCount = (value: number | null | undefined, locale: string) => (
  value === null || value === undefined ? '--' : formatNumber(value, locale)
)

export const getFloorStatusLabel = (dictionary: FloorDictionary, status: string) => {
  if (status === 'A') return floorText(dictionary, 'statusA', 'Active')
  if (status === 'I') return floorText(dictionary, 'statusI', 'Inactive')
  if (status === 'B') return floorText(dictionary, 'statusB', 'Blocked')
  if (status === 'DRAFT') return floorText(dictionary, 'statusDRAFT', 'Draft')

  return status || '-'
}

export const getFloorStatusColor = (status: string): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}
