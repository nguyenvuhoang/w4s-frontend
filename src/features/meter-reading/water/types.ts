import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type WaterMeterDictionary = Awaited<ReturnType<typeof getDictionary>>

export type WaterMeterPeriod = {
    id: number
    project_id: number
    project_code: string
    year: number
    month: number
    fee_period_id: number | null
    status: string
    locked_on_utc: string | null
    locked_by_user_code: string | null
}

export type WaterMeterReading = {
    id: number
    water_meter_period_id: number
    project_id: number
    project_code: string
    apartment_id: number
    apartment_code: string
    building_code: string
    floor: string
    water_meter_code: string
    last_index: number | null
    new_index: number | null
    consumption: number | null
    status: string
    recorded_by_user_code: string | null
    recorded_on_utc: string | null
}

export type WaterUsageItem = {
    water_meter_period_id: number
    year: number
    month: number
    consumption: number | null
    last_index: number | null
    new_index: number | null
}

export type WaterUsageResponse = {
    apartment_id: number
    apartment_code: string
    usage: WaterUsageItem[]
}

export type WaterMeterFilter = {
    project_id: number | null
    apartment_id: number | null
    water_meter_period_id: number | null
}

export type SaveWaterMeterReadingRequest = {
    new_index: number
    apartment_id: number
    water_meter_period_id: number
    last_index: number | ''
}

export type WaterMeterReadingPageProps = {
    dictionary: WaterMeterDictionary
    session: Session | null
    locale: Locale
    initial_filter: WaterMeterFilter
    initial_periods: WaterMeterPeriod[]
    initial_readings: WaterMeterReading[]
    initial_usage: WaterUsageResponse
}

export type WaterMeterSearchFilter = {
    project_id: number | null
    building_id: number | null
    apartment_id: number | null
    water_meter_period_id: number | null
    search_text: string
    page_index: number
    page_size: number
}

export type WaterMeterSearchItem = {
    id: number
    water_meter_period_id: number
    project_id: number
    project_code: string
    building_id: number
    building_code: string
    apartment_id: number
    apartment_code: string
    floor: string
    water_meter_code: string
    last_index: number | null
    new_index: number | null
    consumption: number | null
    status: string
    recorded_by_user_code: string | null
    recorded_by_user_name: string | null
    recorded_on_utc: string | null
}

export type WaterMeterSearchResponse = {
    items: WaterMeterSearchItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
}

export type WaterMeterBuildingOption = {
    id: number
    building_code: string
    name: string
}

export type WaterMeterApartmentOption = {
    id: number
    apartment_code: string
    building_id: number
}

export type WaterMeterSearchPageProps = {
    dictionary: WaterMeterDictionary
    session: Session | null
    locale: Locale
    initial_filter: WaterMeterSearchFilter
    initial_data: WaterMeterSearchResponse
}