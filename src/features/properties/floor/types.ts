import type { Locale } from '@/configs/i18n'
import type { Session } from 'next-auth'

import type { getDictionary } from '@/shared/utils/getDictionary'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'

export type FloorDictionary = Awaited<ReturnType<typeof getDictionary>>

export type FloorPageProps = {
  dictionary: FloorDictionary
  session: Session | null
  locale: Locale
}

export type FloorProjectOption = ProjectSelectorOption

export type FloorBuildingOption = {
  id: number
  building_code: string
  name: string
  status: string
}

// Floor status codes for the search filter ("" = all).
export type FloorStatusFilter = '' | 'A' | 'I'

export type FloorSearchFilter = {
  page_size: number
  /** UI page, 1-based (the request sends page_index - 1). */
  page_index: number
  search_text: string
  /** Optional so other modules reusing the floor search (Apartment) keep working; sent as "" when absent. */
  status?: FloorStatusFilter
  project_id: number | null
  building_id: number | null
}

// WF_BO_SIMPLE_SEARCH_FLOORS input. `status` is a planned Backend filter field.
export type FloorSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  status: FloorStatusFilter
  project_id: number
  building_id: number
}

export type FloorSearchItem = {
  id: number
  floor_code: string
  building_id: number
  project_id: number
  /** Not shown on the Floor screens (customer feedback), but still part of the Backend contract. */
  floor_no: string
  name: string
  /** null when WF_BO_SIMPLE_SEARCH_FLOORS does not return it. */
  description: string | null
  resident_count: number | null
  status: string
}

export type FloorSearchResponse = {
  items: FloorSearchItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type FloorDetailModel = {
  id: number
  floor_code: string
  name: string
  building_id: number
  project_id: number
  status: string
  /**
   * Hidden on the detail screen (customer feedback) but kept: WF_BO_UPDATE_FLOOR still requires them,
   * and they are sent back unchanged unless the floor code changes.
   */
  floor_no: string
  display_order: number | null
  /** Planned Backend field; null when WF_BO_GET_FLOOR_BY_ID does not return it. */
  resident_count: number | null
  description: string | null
}

// WF_BO_CREATE_FLOOR input, exactly as the Backend contract. floor_no / display_order are not
// entered on screen: they are derived from the floor code (see deriveFloorContractFields).
export type FloorCreatePayload = {
  building_id: number
  floor_code: string
  name: string
  floor_no: string
  display_order: number
  description: string
  /** Whole number >= 0; null when left empty. */
  resident_count: number | null
}

// WF_BO_UPDATE_FLOOR input, exactly as the Backend contract.
export type FloorUpdatePayload = {
  id: number
  building_id: number
  floor_code: string
  name: string
  floor_no: string
  display_order: number
  description: string
  /** Whole number >= 0; null when left empty. */
  resident_count: number | null
  status: string
}
