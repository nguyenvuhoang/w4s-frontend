import type { Locale } from '@/configs/i18n'
import type { Session } from 'next-auth'

import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'
import type { getDictionary } from '@/shared/utils/getDictionary'

export type ApartmentDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ApartmentPageProps = {
  dictionary: ApartmentDictionary
  session: Session | null
  locale: Locale
}

export type ApartmentProjectOption = ProjectSelectorOption

export type ApartmentBuildingOption = {
  id: number
  building_code: string
  name: string
  status: string
}

export type ApartmentFloorOption = {
  id: number
  floor_code: string
  name: string
  status: string
  /** From WF_BO_SIMPLE_SEARCH_FLOORS; sent as the apartment's `floor` on create. */
  floor_no: string
}

export type ApartmentStatusFilter = 'all' | 'A' | 'I' | 'D'
export type ApartmentQrFilter = 'all' | 'yes' | 'no'

export type ApartmentSearchFilter = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number | null
  building_id: number | null
  floor_id: number | null
  status: ApartmentStatusFilter
  qr_payment_enabled: ApartmentQrFilter
}

export type ApartmentSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
  building_id: number | null
  floor_id: number | null
  status: string | null
  qr_payment_status: string | null
}

// Shape matches the real WF_BO_ADVANCED_SEARCH_APARTMENT response. It has no
// project_name/building_name/floor_name/owner_name/last_modified fields yet,
// so those are resolved on the FE from the loaded project/building option lists.
export type ApartmentSearchItem = {
  id: number
  apartment_code: string
  unit_number: string
  project_id: number
  building_id: number
  floor_id: number
  floor: string
  apartment_type: string
  area: number | null
  water_meter_code: string
  payment_qr_code: string
  /** null when WF_BO_ADVANCED_SEARCH_APARTMENT does not return it. */
  room_count: number | null
  /** Business apartment status (raw Backend value, no CodeList yet) — NOT the record status A/I. */
  apartment_status: string | null
  /** Record status A / I. */
  status: string
}

export type ApartmentSearchResponse = {
  items: ApartmentSearchItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

// WF_BO_GET_APARTMENT_DETAIL response shape.
export type ApartmentDetailApartment = {
  id: number
  project_id: number
  building_id: number
  floor_id: number
  apartment_code: string
  project_code: string
  building_code: string
  floor_code: string
  floor: string
  unit_number: string
  apartment_type: string
  area: number | null
  water_meter_code: string
  /** Contract field without an input: preserved as-is on update ("" when the detail does not return it). */
  water_meter_code2: string
  /** Contract field without an input: preserved as-is on update ("" when the detail does not return it). */
  electric_meter_code: string
  electricity_meter_code: string
  /** null when the detail does not return it. */
  room_count: number | null
  /** Raw Backend value (e.g. "2026-06-15T00:00:00Z"), "" when not set. */
  handover_date: string
  description: string
  payment_qr_code: string | null
  /** Business apartment status (CodeList IPS / APARTMENT_STATUS code_value); null when not returned. */
  apartment_status: string | null
  /** Record status A / I. */
  status: string
}

// WF_BO_CREATE_APARTMENT request, exactly the Backend contract (17 fields incl. apartment_status and status).
// `floor`, `water_meter_code2` and `electric_meter_code` are not inputs on the create page but are always sent.
export type ApartmentCreateRequest = {
  project_id: number
  building_id: number
  floor_id: number
  apartment_code: string
  unit_number: string
  /** floor_no of the selected floor. */
  floor: string
  water_meter_code: string
  water_meter_code2: string
  electric_meter_code: string
  electricity_meter_code: string
  apartment_type: string
  /** CodeList IPS / APARTMENT_STATUS code_value (never its caption); "" when not chosen. */
  apartment_status: string
  /** Sent as a string, as in the Backend sample ("" when empty). */
  area: string
  room_count: number
  /** "YYYY-MM-DDT00:00:00Z", or "" when not set. */
  handover_date: string
  description: string
  /** Record status A / I. */
  status: string
}

// Create page form state (inputs only).
export type ApartmentCreateFormValues = {
  building_id: number | null
  floor_id: number | null
  /** Typed by the user; the full apartment_code is generated from tower code + floor number + this. */
  unit_number: string
  apartment_type: string
  area: string
  room_count: string
  /** Date input value (YYYY-MM-DD) or ''. */
  handover_date: string
  water_meter_code: string
  electricity_meter_code: string
  description: string
  /** Record status A / I (required; create default "A"). */
  status: string
  /**
   * Business apartment status (CodeList IPS / APARTMENT_STATUS code_value) — never the record status. Create: ""
   * until chosen; edit: kept raw from the detail. Sent as `apartment_status`.
   */
  apartment_status: string
}

// Edit page form state: same inputs as create (record status and apartment status included).
export type ApartmentEditFormValues = ApartmentCreateFormValues

// WF_BO_UPDATE_APARTMENT request, exactly the Backend contract (17 fields incl. apartment_status, no project_id).
export type ApartmentUpdateRequest = {
  id: number
  building_id: number
  floor_id: number
  apartment_code: string
  unit_number: string
  /** floor_no of the selected floor. */
  floor: string
  water_meter_code: string
  water_meter_code2: string
  electric_meter_code: string
  electricity_meter_code: string
  apartment_type: string
  /** CodeList IPS / APARTMENT_STATUS code_value (never its caption); a legacy stored value is sent back unchanged. */
  apartment_status: string
  area: string
  room_count: number
  /** "YYYY-MM-DDT00:00:00Z", or "" when not set. */
  handover_date: string
  description: string
  status: string
}

export type ApartmentDetailProject = {
  id: number
  project_code: string
  name: string
  address: string | null
  description: string | null
  logo_url: string | null
  status: string
}

export type ApartmentDetailBuilding = {
  id: number
  project_id: number
  project_code: string
  building_code: string
  name: string
  floor_count: number | null
  display_order: number | null
  status: string
}

export type ApartmentDetailFloor = {
  id: number
  project_id: number
  building_id: number
  floor_code: string
  name: string
  display_order: number | null
  status: string
}

export type ApartmentDetailResult = {
  apartment: ApartmentDetailApartment | null
  project: ApartmentDetailProject | null
  building: ApartmentDetailBuilding | null
  floor: ApartmentDetailFloor | null
}
