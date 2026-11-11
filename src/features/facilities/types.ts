import type { Locale } from '@/configs/i18n'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type FacilitiesDictionary = Awaited<ReturnType<typeof getDictionary>>

export type FacilitiesPageProps = {
    dictionary: FacilitiesDictionary
    session: Session | null
    locale: Locale
}

export type FacilityStatus = 'A' | 'I' | string

export type FacilityItem = {
    id?: number
    facility_code: string
    project_id: number
    facility_category_id: number | null
    facility_category_code: string | null
    facility_category_name: string | null
    name: string
    description: string | null
    image_url: string | null
    terms_url: string | null
    require_deposit: boolean
    deposit_amount: number | null
    max_slots_per_day: number | null
    advance_booking_days: number | null
    display_order: number | null
    status: FacilityStatus
}

export interface CreateFacilityRequest {
    facility_code: string
    project_id: number
    facility_category_id: number
    name: string
    description: string
    image_url: string
    terms_url: string
    need_accept_policy: boolean
    facility_policy: string
    require_deposit: boolean
    deposit_amount: string | number | null
    max_slots_per_day: string | number | null
    advance_booking_days: string | number | null
    building_id: string | number
    location: string
    price_per_hour: string | number | null
    open_time: string
    close_time: string
    max_capacity: string | number | null
    long_description: string
    rules: string
    max_people_per_booking: string | number | null
    max_slots_per_booking: string | number | null
    price_note: string
    display_order: number
}

export interface CreateFacilityTimeSlotRequest {
    id: number
    name: string
    start_time: string
    end_time: string
    max_capacity: string | number
    day_of_week: string | number
    base_price: string | number
}

export interface CreateFacilityPriceRuleRequest {
    id: number
    time_slot_index?: string | number
    rule_type: string
    specific_date?: string
    price_adjustment_type: string
    adjustment_value: string | number
    priority: string | number
}

export interface CreateFacilitySetupRequest {
    facility: CreateFacilityRequest
    time_slots: CreateFacilityTimeSlotRequest[]
    price_rules: CreateFacilityPriceRuleRequest[]
}

export interface CreatedFacilityDetail extends CreateFacilityRequest {
    id?: number
    status?: string
}

export interface UpdateFacilityRequest {
    display_order: number
    name: string
    deposit_amount: string | number
    status: string
    facility_category_id: number
    max_slots_per_day: string | number
    image_url: string
    terms_url: string
    require_deposit: boolean
    id: number
    advance_booking_days: string | number
    description: string
}

export interface DeactivateFacilityRequest {
    id: number
}

export interface UpdatedFacilityDetail extends UpdateFacilityRequest {
    facility_category_code?: string | null
    facility_code?: string
    project_id?: number
}

export type CreateFacilityFormValues = {
    id?: number | string
    facility_code: string
    facility_category_code?: string
    name: string
    project_id: string | number
    facility_category_id: string | number
    description: string
    image_url: string
    terms_url: string
    need_accept_policy: boolean
    facility_policy: string
    require_deposit: boolean
    deposit_amount: string
    max_slots_per_day: string
    advance_booking_days: string
    building_id: string
    location: string
    price_per_hour: string
    open_time: string
    close_time: string
    max_capacity: string
    long_description: string
    rules: string
    max_people_per_booking: string
    max_slots_per_booking: string
    price_note: string
    display_order: string | number
    status?: string
    time_slots: CreateFacilityTimeSlotRequest[]
    price_rules: CreateFacilityPriceRuleRequest[]
}

export type FacilitiesFilterModel = {
    search_text: string
    project_id: number
    page_index: number
    page_size: number
}

export type FacilitiesSearchRequest = {
    search_text: string
    project_id: number
    page_index: number
    page_size: number
}

export type FacilitiesSearchResponse = {
    items: FacilityItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type FacilityTimeSlotItem = {
    id?: number
    facility_id: number
    name: string
    start_time: string | null
    end_time: string | null
    max_capacity: number | null
    day_of_week: number | null
    base_price: number | null
    status: FacilityStatus
}

export type FacilityTimeSlotsFilterModel = {
    search_text: string
    facility_id: number
    page_index: number
    page_size: number
}

export type FacilityTimeSlotsSearchRequest = {
    search_text: string
    facility_id: number
    page_index: number
    page_size: number
}

export type FacilityTimeSlotsSearchResponse = {
    items: FacilityTimeSlotItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type FacilitiesTabKey = 'facilities' | 'categories'

export type FacilityCategoryItem = {
    id?: number
    facility_category_id?: number
    category_code: string
    project_id: number
    name: string
    icon_url: string | null
    display_order: number | null
    status: FacilityStatus
}

export type FacilityProjectOption = ProjectSelectorOption

export type FacilityProjectSearchResponse = {
    items: FacilityProjectOption[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
    has_next_page: boolean
}

export type FacilityCategoryDetail = FacilityCategoryItem

export type GetFacilityCategoryByIdRequest = {
    id: number
}

export type FacilityCategoriesFilterModel = {
    search_text: string
    project_id: number
    page_index: number
    page_size: number
}

export type FacilityCategorySearchRequest = {
    search_text: string
    project_id: number
    page_index: number
    page_size: number
}

export type FacilityCategorySearchResponse = {
    items: FacilityCategoryItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}
