import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type FacilityBookingsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type FacilityBookingsPageProps = {
    dictionary: FacilityBookingsDictionary
    session: Session | null
    locale: Locale
}

export type FacilityBookingItem = {
    id: number
    project_id: number
    facility_id: number
    apartment_id: number
    resident_id: number | null
    user_code: string | null
    booking_code: string
    project_code: string
    facility_code: string
    facility_time_slot_id: number
    apartment_code: string
    booking_date: string
    start_time: string | null
    end_time: string | null
    note: string | null
    terms_accepted: boolean
    status: string
    service_fee: number | null
    total_amount: number | null
    deposit_amount: number | null
    payment_method: string | null
    approved_by_user_code: string | null
    approved_on_utc: string | null
}

export type CreateFacilityBookingForm = {
    booking_date: string
    project_id: string | number
    end_time: string
    apartment_id: string | number
    facility_id: string | number
    terms_accepted: boolean
    note: string
    facility_time_slot_id: string | number
    start_time: string
}

export type CreateFacilityBookingRequest = {
    booking_date: string
    project_id: number
    end_time: string
    apartment_id: number
    facility_id: number
    terms_accepted: boolean
    note: string
    facility_time_slot_id: number
    start_time: string
}

export type DeactivateFacilityBookingRequest = {
    id: number
}

export class FacilityBookingWorkflowError extends Error {
    next_action?: string
    error_code?: string

    constructor(message: string, next_action?: string, error_code?: string) {
        super(message)
        this.name = 'FacilityBookingWorkflowError'
        this.next_action = next_action
        this.error_code = error_code
    }
}

export type FacilityBookingFilterModel = {
    search_text: string
    project_id: number
    page_index: number
    page_size: number
}

export type FacilityBookingSearchRequest = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
}

export type FacilityBookingSearchResponse = {
    items: FacilityBookingItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
}
