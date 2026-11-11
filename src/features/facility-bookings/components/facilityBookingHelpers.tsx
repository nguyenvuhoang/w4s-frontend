import type { FacilityBookingFilterModel, FacilityBookingsDictionary } from '../types'

export const empty_facility_booking_filter: FacilityBookingFilterModel = {
    search_text: '',
    project_id: 1,
    page_index: 0,
    page_size: 10
}

export const bookingText = (dictionary: FacilityBookingsDictionary, key: string, fallback = key) => (
    dictionary.facility_bookings?.[key] ?? fallback
)

export const commonText = (dictionary: FacilityBookingsDictionary, key: string, fallback = key) => (
    dictionary.common?.[key] ?? fallback
)

export const formatNullableText = (value?: string | number | null) => (
    value === null || value === undefined || value === '' ? '-' : String(value)
)

export const formatBookingDate = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(date)
}

export const formatBookingMoney = (value: number | null, locale: string) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'

    return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(Number(value))
}

const normalizeTime = (value: string | null) => {
    if (!value) return ''

    const date = new Date(value)

    if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
    }

    const match = value.match(/^(\d{1,2}):(\d{2})/)

    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : value
}

export const formatTimeSlot = (start_time: string | null, end_time: string | null) => {
    const start = normalizeTime(start_time)
    const end = normalizeTime(end_time)

    if (!start && !end) return '-'
    if (start && end) return `${start} - ${end}`

    return start || end
}

export const getBookingStatusColor = (status: string) => {
    if (status === 'APPROVED' || status === 'COMPLETED') return 'success'
    if (status === 'REJECTED' || status === 'CANCELLED') return 'error'
    if (status === 'PENDING') return 'warning'
    if (status === 'D') return 'default'

    return 'default'
}

export const getBookingStatusLabel = (dictionary: FacilityBookingsDictionary, status: string) => {
    const normalized = status || ''

    if (normalized === 'PENDING') return bookingText(dictionary, 'status_pending', 'Pending')
    if (normalized === 'APPROVED') return bookingText(dictionary, 'status_approved', 'Approved')
    if (normalized === 'REJECTED') return bookingText(dictionary, 'status_rejected', 'Rejected')
    if (normalized === 'CANCELLED') return bookingText(dictionary, 'status_cancelled', 'Cancelled')
    if (normalized === 'COMPLETED') return bookingText(dictionary, 'status_completed', 'Completed')
    if (normalized === 'D') return bookingText(dictionary, 'status_deactivated')

    return normalized || '-'
}

export const getBookingBooleanLabel = (dictionary: FacilityBookingsDictionary, value: boolean) => (
    value ? commonText(dictionary, 'yes') : commonText(dictionary, 'no')
)
