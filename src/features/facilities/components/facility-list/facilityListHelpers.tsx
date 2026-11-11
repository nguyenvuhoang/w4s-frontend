import type {
    FacilitiesDictionary,
    FacilitiesFilterModel,
    FacilityCategoriesFilterModel,
    FacilityItem,
    FacilityStatus
} from '../../types'

export const default_project_id = 1

export const empty_facilities_filter: FacilitiesFilterModel = {
    search_text: '',
    project_id: default_project_id,
    page_index: 0,
    page_size: 10
}

export const empty_facility_categories_filter: FacilityCategoriesFilterModel = {
    search_text: '',
    project_id: default_project_id,
    page_index: 0,
    page_size: 10
}

export const facilitiesText = (dictionary: FacilitiesDictionary, key: string, fallback: string) => (
    dictionary.facilities?.[key] ?? fallback
)

export const commonText = (dictionary: FacilitiesDictionary, key: string, fallback: string) => (
    dictionary.common?.[key] ?? fallback
)

export const getFacilityStatusColor = (status: FacilityStatus) => {
    if (status === 'A') return 'success'
    if (status === 'I') return 'default'

    return 'warning'
}

export const getFacilityStatusLabel = (dictionary: FacilitiesDictionary, status: FacilityStatus) => {
    if (status === 'A') return facilitiesText(dictionary, 'status_active', 'Active')
    if (status === 'I') return facilitiesText(dictionary, 'status_inactive', 'Inactive')

    return status || '-'
}

export const getBooleanLabel = (dictionary: FacilitiesDictionary, value: boolean) => (
    value
        ? facilitiesText(dictionary, 'boolean_yes', commonText(dictionary, 'yes', 'Yes'))
        : facilitiesText(dictionary, 'boolean_no', commonText(dictionary, 'no', 'No'))
)

export const formatFacilityMoney = (value: FacilityItem['deposit_amount'], locale: string) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'

    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(Number(value))
}

export const formatNullableNumber = (value?: number | null) => (
    value === null || value === undefined || Number.isNaN(Number(value)) ? '-' : String(value)
)
