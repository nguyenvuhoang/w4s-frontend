import { emptyContractsFilter } from '@/features/contracts/components/contractHelpers'
import { emptyVendorsFilter } from '@/features/contracts/components/vendorHelpers'
import { emptyAnnouncementFilter } from '@/features/announcement/components/announcementListHelpers'
import { empty_facility_booking_filter } from '@/features/facility-bookings/components/facilityBookingHelpers'
import {
  empty_facility_categories_filter,
  empty_facilities_filter
} from '@/features/facilities/components/facility-list/facilityListHelpers'
import { emptyServiceRequestsFilter } from '@/features/service-requests/components/serviceRequestHelpers'
import { emptyResidentFeedbackFilter } from '@/features/resident-feedback/components/residentFeedbackHelpers'
import { emptyFeeTypeFilter } from '@/features/fees/components/feeTypeHelpers'
import { emptyFeeInvoiceFilter } from '@/features/fees/components/feeInvoiceHelpers'
import { emptyAssetFilter } from '@/features/assets/components/assetHelpers'
import { emptyBannerFilter } from '@/features/banners/components/bannerHelpers'
import { emptyPromotionFilter } from '@/features/promotions/components/promotionHelpers'
import { emptyPartnerFilter } from '@/features/partners/partnerHelpers'
import type { ContractsFilterModel } from '@/features/contracts/types'
import type { VendorsFilterModel } from '@/features/contracts/vendorTypes'
import type { AnnouncementFilterModel } from '@/features/announcement/types'
import type { FeeTypeFilterModel, FeeInvoiceFilterModel } from '@/features/fees/types'
import type { AssetFilterModel } from '@/features/assets/types'
import type { BannerFilterModel } from '@/features/banners/types'
import type { PromotionFilterModel } from '@/features/promotions/types'
import type { PartnerFilterModel } from '@/features/partners/types'
import type { FacilityBookingFilterModel } from '@/features/facility-bookings/types'
import type {
  FacilitiesFilterModel,
  FacilitiesTabKey,
  FacilityCategoriesFilterModel
} from '@/features/facilities/types'
import type { ServiceRequestsFilter } from '@/features/service-requests/types'
import type { ResidentFeedbackFilter } from '@/features/resident-feedback/types'
import type {
  WaterMeterFilter,
  WaterMeterSearchFilter
} from '@/features/meter-reading/water/types'
import { empty_water_search_filter } from '@/features/meter-reading/water/components/waterMeterSearchHelpers'
import { emptyAuditLogFilter } from '@/features/system-settings/audit-logs/components/auditLogHelpers'
import type { AuditLogFilterModel } from '@/features/system-settings/audit-logs/types'
import { emptyUserRoleFilter } from '@/features/system-settings/user-roles/components/userRoleHelpers'
import type { UserRoleFilterModel } from '@/features/system-settings/user-roles/types'
import { emptyMenuCommandFilter } from '@/features/system-settings/menu-management/components/menuCommandHelpers'
import type { MenuCommandFilterModel } from '@/features/system-settings/menu-management/types'

export type SearchParams = Record<string, string | string[] | undefined>

export const getSearchValue = (search_params: SearchParams, key: string) => {
  const value = search_params[key]
  return Array.isArray(value) ? value[0] : value
}

export const parseFacilitiesFilter = (search_params: SearchParams): FacilitiesFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? empty_facilities_filter.search_text,
    project_id: Number.isFinite(project_id) && project_id > 0 ? project_id : empty_facilities_filter.project_id,
    page_index: Number.isFinite(page_index) && page_index > 0 ? page_index : empty_facilities_filter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : empty_facilities_filter.page_size
  }
}

export const parseFacilityCategoriesFilter = (search_params: SearchParams): FacilityCategoriesFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'category_page_index'))
  const page_size = Number(getSearchValue(search_params, 'category_page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'category_search_text') ?? empty_facility_categories_filter.search_text,
    project_id: Number.isFinite(project_id) && project_id > 0 ? project_id : empty_facility_categories_filter.project_id,
    page_index: Number.isFinite(page_index) && page_index > 0 ? page_index : empty_facility_categories_filter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : empty_facility_categories_filter.page_size
  }
}

export const parseFacilitiesTab = (search_params: SearchParams): FacilitiesTabKey => (
  getSearchValue(search_params, 'tab') === 'categories' ? 'categories' : 'facilities'
)

export const parseFacilityBookingFilter = (search_params: SearchParams): FacilityBookingFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? empty_facility_booking_filter.search_text,
    project_id: Number.isFinite(project_id) && project_id > 0 ? project_id : empty_facility_booking_filter.project_id,
    page_index: Number.isFinite(page_index) && page_index > 0 ? page_index : empty_facility_booking_filter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : empty_facility_booking_filter.page_size
  }
}

export const parseFeeTypeFilter = (search_params: SearchParams): FeeTypeFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyFeeTypeFilter.search_text,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyFeeTypeFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyFeeTypeFilter.page_size
  }
}

export const parseFeeInvoiceFilter = (search_params: SearchParams): FeeInvoiceFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))
  const fee_period_id = Number(getSearchValue(search_params, 'fee_period_id'))
  const fee_type_id = Number(getSearchValue(search_params, 'fee_type_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyFeeInvoiceFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : emptyFeeInvoiceFilter.project_id,
    fee_period_id: Number.isInteger(fee_period_id) && fee_period_id > 0 ? fee_period_id : emptyFeeInvoiceFilter.fee_period_id,
    fee_type_id: Number.isInteger(fee_type_id) && fee_type_id > 0 ? fee_type_id : emptyFeeInvoiceFilter.fee_type_id,
    status: getSearchValue(search_params, 'status') ?? emptyFeeInvoiceFilter.status,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyFeeInvoiceFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyFeeInvoiceFilter.page_size
  }
}

export const parseAssetFilter = (search_params: SearchParams): AssetFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))
  const category = getSearchValue(search_params, 'category') ?? emptyAssetFilter.category
  const status = getSearchValue(search_params, 'status') ?? emptyAssetFilter.status

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyAssetFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : emptyAssetFilter.project_id,
    category: ['PLUMBING', 'ELECTRICAL', 'HVAC', 'SECURITY', 'FURNITURE', 'OTHER'].includes(category) ? category : emptyAssetFilter.category,
    status: ['A', 'I', 'B', 'DRAFT'].includes(status) ? status : emptyAssetFilter.status,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyAssetFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyAssetFilter.page_size
  }
}

export const parseWaterMeterFilter = (search_params: SearchParams): WaterMeterFilter => {
  const project_id = Number(getSearchValue(search_params, 'project_id'))
  const apartment_id = Number(getSearchValue(search_params, 'apartment_id'))
  const water_meter_period_id = Number(getSearchValue(search_params, 'water_meter_period_id'))

  return {
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : 1,
    apartment_id: Number.isInteger(apartment_id) && apartment_id > 0 ? apartment_id : null,
    water_meter_period_id: Number.isInteger(water_meter_period_id) && water_meter_period_id > 0 ? water_meter_period_id : null
  }
}

export const parseWaterMeterSearchFilter = (search_params: SearchParams): WaterMeterSearchFilter => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    ...empty_water_search_filter,
    search_text: getSearchValue(search_params, 'search_text') ?? empty_water_search_filter.search_text,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : empty_water_search_filter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : empty_water_search_filter.page_size
  }
}

export const parseContractsFilter = (search_params: SearchParams): ContractsFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyContractsFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : emptyContractsFilter.project_id,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyContractsFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyContractsFilter.page_size
  }
}

export const parseVendorsFilter = (search_params: SearchParams): VendorsFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyVendorsFilter.search_text,
    // The active project is supplied by the working-project context in useVendors.
    project_id: emptyVendorsFilter.project_id,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyVendorsFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyVendorsFilter.page_size
  }
}

export const parseAnnouncementFilter = (search_params: SearchParams): AnnouncementFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))
  const category = getSearchValue(search_params, 'category') ?? emptyAnnouncementFilter.category
  const status = getSearchValue(search_params, 'status') ?? emptyAnnouncementFilter.status

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyAnnouncementFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : 0,
    category: ['OPERATION', 'NEWS', 'ANNOUNCEMENT', 'EVENT', 'MAINTENANCE', 'OTHER'].includes(category) ? category : emptyAnnouncementFilter.category,
    status: ['A', 'I', 'R'].includes(status) ? status : emptyAnnouncementFilter.status,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyAnnouncementFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyAnnouncementFilter.page_size
  }
}

export const parseServiceRequestsFilter = (search_params: SearchParams): ServiceRequestsFilter => {
  const pageIndex = Number(getSearchValue(search_params, 'page_index'))
  const pageSize = Number(getSearchValue(search_params, 'page_size'))
  const projectId = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyServiceRequestsFilter.search_text,
    request_status: getSearchValue(search_params, 'request_status') ?? emptyServiceRequestsFilter.request_status,
    project_id: Number.isInteger(projectId) && projectId > 0 ? projectId : emptyServiceRequestsFilter.project_id,
    page_index: Number.isInteger(pageIndex) && pageIndex > 0 ? pageIndex : emptyServiceRequestsFilter.page_index,
    page_size: [5, 10, 20, 50].includes(pageSize) ? pageSize : emptyServiceRequestsFilter.page_size
  }
}

export const parseResidentFeedbackFilter = (search_params: SearchParams): ResidentFeedbackFilter => {
  const pageIndex = Number(getSearchValue(search_params, 'page_index'))
  const pageSize = Number(getSearchValue(search_params, 'page_size'))
  const projectId = Number(getSearchValue(search_params, 'project_id'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyResidentFeedbackFilter.search_text,
    request_status: getSearchValue(search_params, 'request_status') ?? emptyResidentFeedbackFilter.request_status,
    project_id: Number.isInteger(projectId) && projectId > 0 ? projectId : emptyResidentFeedbackFilter.project_id,
    page_index: Number.isInteger(pageIndex) && pageIndex >= 0 ? pageIndex : emptyResidentFeedbackFilter.page_index,
    page_size: [5, 10, 20, 50].includes(pageSize) ? pageSize : emptyResidentFeedbackFilter.page_size
  }
}

export const parseAuditLogFilter = (search_params: SearchParams): AuditLogFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const status = Number(getSearchValue(search_params, 'status'))

  return {
    workflowid: getSearchValue(search_params, 'workflowid') ?? emptyAuditLogFilter.workflowid,
    execution_id: getSearchValue(search_params, 'execution_id') ?? emptyAuditLogFilter.execution_id,
    status: status === 2 || status === 3 ? status : emptyAuditLogFilter.status,
    from_date: getSearchValue(search_params, 'from_date') || null,
    to_date: getSearchValue(search_params, 'to_date') || null,
    page_index: Number.isInteger(page_index) && page_index >= 0 ? page_index : emptyAuditLogFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyAuditLogFilter.page_size
  }
}

export const parseBannerFilter = (search_params: SearchParams): BannerFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyBannerFilter.page_size,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyBannerFilter.page_index,
    search_text: getSearchValue(search_params, 'search_text') ?? emptyBannerFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : emptyBannerFilter.project_id
  }
}

export const parsePromotionFilter = (search_params: SearchParams): PromotionFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyPromotionFilter.page_size,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyPromotionFilter.page_index,
    search_text: getSearchValue(search_params, 'search_text') ?? emptyPromotionFilter.search_text,
    project_id: Number.isInteger(project_id) && project_id > 0 ? project_id : emptyPromotionFilter.project_id
  }
}

export const parsePartnerFilter = (search_params: SearchParams): PartnerFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyPartnerFilter.search_text,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyPartnerFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyPartnerFilter.page_size
  }
}

export const parseUserRoleFilter = (search_params: SearchParams): UserRoleFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyUserRoleFilter.search_text,
    channel_code: 'BO',
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyUserRoleFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyUserRoleFilter.page_size
  }
}

export const parseMenuCommandFilter = (search_params: SearchParams): MenuCommandFilterModel => {
  const page_index = Number(getSearchValue(search_params, 'page_index'))
  const page_size = Number(getSearchValue(search_params, 'page_size'))

  return {
    search_text: getSearchValue(search_params, 'search_text') ?? emptyMenuCommandFilter.search_text,
    page_index: Number.isInteger(page_index) && page_index > 0 ? page_index : emptyMenuCommandFilter.page_index,
    page_size: [5, 10, 20, 50].includes(page_size) ? page_size : emptyMenuCommandFilter.page_size
  }
}
