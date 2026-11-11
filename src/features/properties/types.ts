import type { ProjectBankAccount, ProjectBankAccountUpdatePayload } from './project/bank/projectBankTypes'

export type PropertyStatus = 'active' | 'inactive' | 'draft' | 'paused' | 'pending'
export type ApartmentStatus = 'occupied' | 'vacant' | 'handed_over' | 'locked'
export type PaymentConfigStatus = 'active' | 'inactive' | 'pending'
export type FloorPlanLayoutItemType = 'apartment' | 'elevator' | 'stair' | 'technical' | 'corridor' | 'service'
export type FloorPlanPosition = 'top' | 'middle' | 'bottom'
export type ProjectSitePlanShapeType = 'rectangle' | 'l_shape' | 'u_shape' | 'custom_polygon'

export type ProjectModel = {
  id: number
  project_code: string
  name: string
  project_name: string
  image_url: string
  logo_url: string | null
  investor: string
  management_company: string
  address: string
  province: string
  /** null = not provided by the Backend (unknown), which is different from a confirmed 0. */
  total_buildings: number | null
  total_floors: number | null
  total_units: number | null
  active_residents: number | null
  /** null = unknown (not in the Backend response); never defaulted to 'pending' / false / ''. */
  payment_config_status: PaymentConfigStatus | null
  qr_payment_enabled: boolean | null
  voucher_enabled: boolean | null
  status: PropertyStatus
  last_modified: string | null
  description?: string | null
}

export type BuildingModel = {
  id: number
  project_code: string
  project_name: string
  building_code: string
  building_name: string
  total_floors: number
  total_units: number
  active_residents: number
  display_order: number
  status: PropertyStatus
  last_modified: string
  description?: string
}

export type FloorModel = {
  id: number
  project_code: string
  project_name: string
  building_code: string
  building_name: string
  floor_code: string
  floor_no: number
  floor_name: string
  display_order: number
  total_units: number
  active_units: number
  status: PropertyStatus
  last_modified: string
  description?: string
}

export type ApartmentModel = {
  id: number
  project_code: string
  project_name: string
  building_code: string
  building_name: string
  floor_code: string
  floor_no: number
  apartment_code: string
  apartment_no: string
  area: number
  owner_name: string
  water_meter_code: string
  electricity_meter_code: string
  qr_payment_enabled: boolean
  status: ApartmentStatus
  last_modified: string
  description?: string
}

export type FloorPlanApartmentItem = Omit<
  ApartmentModel,
  'id' | 'project_code' | 'project_name' | 'building_code' | 'building_name' | 'floor_code' | 'floor_no' | 'last_modified'
> & {
  item_type: 'apartment'
  position: Exclude<FloorPlanPosition, 'middle'>
  sort_order: number
  current_debt: number
  latest_fee_status: 'paid' | 'unpaid' | 'overdue'
}

export type FloorPlanFacilityItem = {
  item_type: Exclude<FloorPlanLayoutItemType, 'apartment'>
  position: FloorPlanPosition
  sort_order: number
  label: string
}

export type FloorPlanLayoutItem = FloorPlanApartmentItem | FloorPlanFacilityItem

export type FloorPlanSummary = {
  total_units: number
  occupied_units: number
  vacant_units: number
  handed_over_units: number
  locked_units: number
  qr_enabled_units: number
}

export type ApartmentDetailModel = ApartmentModel & {
  current_debt: number
  latest_fee_status: 'paid' | 'unpaid' | 'overdue'
}

export type StackingPlanFloorModel = Pick<FloorModel, 'floor_code' | 'floor_no' | 'floor_name'> & {
  summary: FloorPlanSummary
  layout: FloorPlanLayoutItem[]
  apartments: FloorPlanApartmentItem[]
}

export type StackingPlanModel = {
  project_code: string
  project_name: string
  building_code: string
  building_name: string
  floors: StackingPlanFloorModel[]
}

export type ProjectSitePlanItem = {
  building_code: string
  building_name: string
  shape_type: ProjectSitePlanShapeType
  position_x: number
  position_y: number
  width: number
  depth: number
  height_level: number
  rotation: number
  display_order: number
  total_floors: number
  total_units: number
  active_residents: number
  status: PropertyStatus
  last_modified: string
}

export type ProjectSitePlanModel = {
  project_code: string
  project_name: string
  layout_type: 'parallel_row' | 'cluster_rectangle' | 'u_shape' | 'l_shape' | 'custom' | 'site_plan'
  site_plan: {
    view_mode: 'isometric'
    canvas_width: number
    canvas_height: number
    items: ProjectSitePlanItem[]
  }
}

export type ProjectContactModel = {
  id: number
  project_code: string
  contact_type: 'management_board' | 'security' | 'technical' | 'reception' | 'emergency'
  contact_name: string
  phone_number: string
  email: string
  position: string
  working_time: string
  is_emergency: boolean
  status: PropertyStatus
}

export type ProjectPaymentConfigModel = {
  id: number
  project_code: string
  project_name: string
  fee_type_code: string
  fee_type_name: string
  payment_channels: string[]
  payment_provider: string
  bank_account_no: string
  bank_name: string
  qr_dynamic_enabled: boolean
  auto_reconcile_enabled: boolean
  status: PropertyStatus
  last_modified: string
  description?: string
}

export type ProjectBuildingModel = {
  id?: number
  building_id: number
  building_code: string
  project_id: number
  name: string
  floor_count: number
  /** Per-building count from WF_BO_GET_BUILDING_BY_PROJECT_ID; null = not returned (shown as "--"). */
  total_apartments?: number | null
  /** Per-building count from WF_BO_GET_BUILDING_BY_PROJECT_ID; null = not returned (shown as "--"). */
  active_residents?: number | null
  display_order: number | null
  status: PropertyStatus
}

export type ProjectBuildingSummaryModel = {
  total_floors: number
  total_apartments: number
  total_residents: number
}

export type ProjectBuildingsByProjectResponseModel = {
  buildings: ProjectBuildingModel[]
  total_floors?: number
  total_apartments?: number
  total_residents?: number
}

export type ProjectContactItemModel = {
  project_id: number
  project_code: string
  contact_type: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  working_hours: string | null
  note: string | null
  display_order: number | null
}

export type ProjectDetailModel = {
  id: number
  project_code: string
  name: string
  address: string | null
  description: string | null
  logo_url: string | null
  status: PropertyStatus
  investor?: string | null
  province?: string | null
  /** Date-only (YYYY-MM-DD). Planned Backend field of WF_BO_GET_PROJECT_DETAIL. */
  handover_date?: string | null
  total_buildings?: number
  total_floors?: number
  total_apartments?: number
  total_residents?: number
  /** Top-level aggregates of WF_BO_GET_PROJECT_DETAIL (outside `project`); undefined = not returned. */
  active_residents?: number
  inactive_residents?: number
  /**
   * Bank accounts (WF_BO_CREATE_PROJECT contract). Not confirmed in WF_BO_GET_PROJECT_DETAIL yet: mapped only
   * when the response carries them, null = not returned.
   */
  operating_bank_account?: ProjectBankAccount | null
  deposit_bank_account?: ProjectBankAccount | null
}

// Planned WF_BO_UPDATE_PROJECT input (confirmed with Backend): no project_type, adds handover_date.
// `status` is the UI value; the service maps it to the backend code (A/I).
export type ProjectUpdatePayload = {
  id: number
  project_code: string
  name: string
  address: string
  description: string
  logo_url: string
  status: PropertyStatus
  investor: string
  province: string
  /** YYYY-MM-DD, or null when not set. */
  handover_date: string | null
  /**
   * Bank accounts of the project (WF_BO_UPDATE_PROJECT contract, `id` = bank account ID). Present only for an
   * account GET returned with its ID; absent = not sent (never an empty object or a guessed id).
   */
  operating_bank_account?: ProjectBankAccountUpdatePayload
  deposit_bank_account?: ProjectBankAccountUpdatePayload
}

// Planned WF_BO_CREATE_PROJECT input (confirmed with Backend): no id/status/project_type, adds handover_date.
export type ProjectCreatePayload = {
  name: string
  province: string
  address: string
  investor: string
  project_code: string
  logo_url: string
  description: string
  /** YYYY-MM-DD, or null when not set. */
  handover_date: string | null
  /** Added by Backend to WF_BO_CREATE_PROJECT: always sent (empty strings when not filled). */
  operating_bank_account: ProjectBankAccount
  deposit_bank_account: ProjectBankAccount
}

// Project status codes accepted by WF_BO_SIMPLE_SEARCH_PROJECTS ("" = all).
export type ProjectStatusFilter = '' | 'A' | 'I'

export type ProjectFilterModel = {
  search_text: string
  status: ProjectStatusFilter
  province: string
  page_index: number
  page_size: number
}

// WF_BO_SIMPLE_SEARCH_PROJECTS input. `province` is a planned Backend field (confirmed, not yet deployed).
export type ProjectSearchRequest = {
  page_size: number
  page_index: number
  status: ProjectStatusFilter
  search_text: string
  project_name: string
  province: string
}

export type ProjectSearchResponse = {
  items: ProjectModel[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type BuildingFilterModel = {
  project_code: string
  keyword: string
  status: 'all' | PropertyStatus
}

export type FloorFilterModel = BuildingFilterModel & {
  building_code: string
}

export type ApartmentFilterModel = FloorFilterModel & {
  floor_code: string
  apartment_status: 'all' | ApartmentStatus
  qr_payment_enabled: 'all' | 'yes' | 'no'
}

export type StackingPlanFilterModel = {
  project_code: string
  building_code: string
  floor_code: string
  apartment_status: 'all' | ApartmentStatus
  keyword: string
}

export type ProjectContactFilterModel = {
  project_code: string
  contact_type: 'all' | ProjectContactModel['contact_type']
  keyword: string
  status: 'all' | PropertyStatus
}

export type ProjectPaymentConfigFilterModel = {
  project_code: string
  fee_type_code: string
  payment_provider: string
  qr_dynamic_enabled: 'all' | 'yes' | 'no'
  status: 'all' | PropertyStatus
}

export type ProjectPayload = Omit<
  ProjectModel,
  | 'id'
  | 'name'
  | 'logo_url'
  | 'total_buildings'
  | 'total_floors'
  | 'total_units'
  | 'active_residents'
  | 'payment_config_status'
  | 'qr_payment_enabled'
  | 'voucher_enabled'
  | 'last_modified'
>

export type BuildingPayload = Omit<
  BuildingModel,
  'id' | 'project_name' | 'total_units' | 'active_residents' | 'last_modified'
>

export type FloorPayload = Omit<
  FloorModel,
  'id' | 'project_name' | 'building_name' | 'total_units' | 'active_units' | 'last_modified'
>

export type ApartmentPayload = Omit<ApartmentModel, 'id' | 'project_name' | 'building_name' | 'floor_no' | 'last_modified'>

export type ProjectContactPayload = Omit<ProjectContactModel, 'id'>

export type ProjectPaymentConfigPayload = Omit<ProjectPaymentConfigModel, 'id' | 'project_name' | 'fee_type_name' | 'last_modified'>

export type ApartmentResidentApartmentInfo = {
  apartment_id: number
  apartment_code: string
  project_id: number
  building_id: number
  floor_id: number
  floor: string | null
  unit_number: string | null
  area: number | null
  water_meter_code: string | null
  payment_qr_code: string | null
  apartment_type: string
  status: string
}

export type ApartmentResidentItem = {
  resident_id: number
  apartment_id: number
  project_id: number
  resident_code: string
  /** Login name of the resident's account (WF_BO_GET_LIST_RESIDENT_BY_APARTMENT_ID); null when not returned. */
  login_name?: string | null
  user_code: string | null
  full_name: string
  gender: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  identity_number: string | null
  role: string
  is_representative: boolean
  is_primary: boolean
  is_location: boolean
  relationship_with_owner: string | null
  effective_from: string | null
  effective_to: string | null
  resident_status: string
  resident_apartment_status: string
}

export type ApartmentResidentManagementResult = {
  apartment: ApartmentResidentApartmentInfo | null
  residents: ApartmentResidentItem[]
}
