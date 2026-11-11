import type { Locale } from '@/configs/i18n'
import type { Session } from 'next-auth'

import type { getDictionary } from '@/shared/utils/getDictionary'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'

export type BuildingDictionary = Awaited<ReturnType<typeof getDictionary>>

export type BuildingPageProps = {
  dictionary: BuildingDictionary
  session: Session | null
  locale: Locale
}

export type BuildingProjectOption = ProjectSelectorOption

// Tower status codes for the search filter ("" = all).
export type BuildingStatusFilter = '' | 'A' | 'I'

export type BuildingSearchFilter = {
  page_size: number
  /** UI page, 1-based (the request sends page_index - 1). */
  page_index: number
  search_text: string
  project_id: number | null
  /** Optional so other modules reusing the tower search keep working; sent as "" when absent. */
  status?: BuildingStatusFilter
}

// WF_BO_SIMPLE_SEARCH_BUILDINGS input.
export type BuildingSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
  status: BuildingStatusFilter
}

export type BuildingSearchItem = {
  id: number
  building_code: string
  project_id: number
  name: string
  floor_count: number | null
  /** null when WF_BO_SIMPLE_SEARCH_BUILDINGS does not return it. */
  description: string | null
  resident_count: number | null
  status: string
}

export type BuildingSearchResponse = {
  items: BuildingSearchItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type BuildingDetailModel = {
  id: number
  building_code: string
  project_id: number
  name: string
  floor_count: number | null
  status: string
  image_url: string | null
  /** Sent back unchanged by WF_BO_UPDATE_BUILDING (not edited on screen); null when not returned. */
  display_order: number | null
  description: string | null
  resident_count: number | null
}

// WF_BO_CREATE_BUILDING input: planned contract { project_id, building_code, name, floor_count }
// (display_order removed per customer feedback) + description / resident_count of the Create page requirement.
// floor_count is sent as a string ("" when empty), as in the Backend sample.
export type BuildingCreatePayload = {
  project_id: number
  building_code: string
  name: string
  floor_count: string
  description: string
  /** Whole number >= 0 (a real 0 stays 0); null when left empty. */
  resident_count: number | null
}

// Create page form values (raw inputs; converted to BuildingCreatePayload by buildBuildingCreatePayload).
export type BuildingCreateFormValues = {
  building_code: string
  name: string
  floor_count: string
  resident_count: string
  description: string
}

// WF_BO_UPDATE_BUILDING input (Backend contract): display_order is back, plus description / resident_count.
export type BuildingUpdatePayload = {
  id: number
  building_code: string
  name: string
  floor_count: string
  /** Stored value from the detail (not edited on screen); null when the detail does not return it. */
  display_order: number | null
  description: string
  /** Whole number >= 0; null when left empty. */
  resident_count: number | null
  status: string
}

export type BuildingDetailWithSummaryModel = {
  building: BuildingDetailModel | null
  summary: ProjectBuildingSummaryModel
}

export type ProjectBuildingSummaryModel = {
  total_floors: number
  total_apartments: number
  total_residents: number
}

export type BuildingsByProjectResponse = {
  project_id: number
  buildings: BuildingSearchItem[]
  total_floors?: number
  total_apartments?: number
  total_residents?: number
}
