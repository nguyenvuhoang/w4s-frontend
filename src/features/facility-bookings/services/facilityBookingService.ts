import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

import type {
    CreateFacilityBookingRequest,
    DeactivateFacilityBookingRequest,
    FacilityBookingFilterModel,
    FacilityBookingItem,
    FacilityBookingSearchRequest,
    FacilityBookingSearchResponse
} from '../types'
import { FacilityBookingWorkflowError } from '../types'

export const FACILITY_BOOKINGS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FACILITY_BOOKINGS'
export const FACILITY_BOOKING_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FACILITY_BOOKING_BY_ID'
export const FACILITY_BOOKING_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FACILITY_BOOKING'
export const FACILITY_BOOKING_DEACTIVATE_WORKFLOW_ID = 'WF_BO_DELETE_FACILITY_BOOKING'

const empty_response: FacilityBookingSearchResponse = {
    items: [],
    page_index: 0,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
        acc[normalizeKey(key)] = item[key]

        return acc
    }, {})

    for (const key of keys) {
        const value = normalizedMap[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const pickDataRoot = (payload: any) => {
    const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
    const data = dataresponse?.data ?? payload?.data ?? payload

    return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(root?.input?.items)) return root.input.items
    if (Array.isArray(root?.input?.data)) return root.input.data

    return []
}

const toNumber = (value: any, fallback: number) => {
    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : fallback
}

const toNullableNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null

    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : null
}

const toBoolean = (value: any) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const getWorkflowErrorMessage = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

    if (Array.isArray(errors) && errors.length > 0) {
        return errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description ?? fallback
    }

    return dataresponse?.message
        ?? dataresponse?.data?.message
        ?? response?.payload?.message
        ?? response?.message
        ?? fallback
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const failed = response?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if ((Array.isArray(errors) && errors.length > 0) || failed) {
        const first_error = Array.isArray(errors) ? errors[0] : undefined

        throw new FacilityBookingWorkflowError(
            getWorkflowErrorMessage(response, fallback),
            first_error?.next_action ?? dataresponse?.next_action,
            first_error?.code
        )
    }
}

const normalizeResponsePage = (value: any, request_page_index: number) => {
    const page_index = toNumber(value, request_page_index + 1)

    return page_index <= 0 ? page_index + 1 : page_index
}

const mapBooking = (item: any): FacilityBookingItem => ({
    id: toNumber(getField(item, ['id']), 0),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    facility_id: toNumber(getField(item, ['facility_id', 'facilityId']), 0),
    apartment_id: toNumber(getField(item, ['apartment_id', 'apartmentId']), 0),
    resident_id: toNullableNumber(getField(item, ['resident_id', 'residentId'])),
    user_code: getField(item, ['user_code', 'userCode']) ?? null,
    booking_code: String(getField(item, ['booking_code', 'bookingCode']) ?? ''),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    facility_code: String(getField(item, ['facility_code', 'facilityCode']) ?? ''),
    facility_time_slot_id: toNumber(getField(item, ['facility_time_slot_id', 'facilityTimeSlotId']), 0),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    booking_date: String(getField(item, ['booking_date', 'bookingDate']) ?? ''),
    start_time: getField(item, ['start_time', 'startTime']) ?? null,
    end_time: getField(item, ['end_time', 'endTime']) ?? null,
    note: getField(item, ['note']) ?? null,
    terms_accepted: toBoolean(getField(item, ['terms_accepted', 'termsAccepted'])),
    status: String(getField(item, ['status']) ?? ''),
    service_fee: toNullableNumber(getField(item, ['service_fee', 'serviceFee'])),
    total_amount: toNullableNumber(getField(item, ['total_amount', 'totalAmount'])),
    deposit_amount: toNullableNumber(getField(item, ['deposit_amount', 'depositAmount'])),
    payment_method: getField(item, ['payment_method', 'paymentMethod']) ?? null,
    approved_by_user_code: getField(item, ['approved_by_user_code', 'approvedByUserCode']) ?? null,
    approved_on_utc: getField(item, ['approved_on_utc', 'approvedOnUtc']) ?? null
})

const mapFacilityBookingDetailResponse = (response: any): FacilityBookingItem => {
    const root = pickDataRoot(response?.payload ?? response)
    const item = pickItems(root)[0] ?? (Array.isArray(root) ? root[0] : root?.item ?? root)

    return mapBooking(item)
}

const runMutation = async ({
    sessiontoken,
    language,
    workflowid,
    fields,
    fallback
}: {
    sessiontoken?: string
    language?: Locale
    workflowid: string
    fields: CreateFacilityBookingRequest | DeactivateFacilityBookingRequest
    fallback: string
}) => {
    if (!sessiontoken) throw new FacilityBookingWorkflowError('Session is required.', 'logout')

    const response = await workflowService.runFODynamic({
        sessiontoken,
        workflowid,
        input: fields,
        language
    })

    assertWorkflowSuccess(response, fallback)
}

export const mapFacilityBookingsSearchResponse = (
    response: any,
    request: FacilityBookingSearchRequest
): FacilityBookingSearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        page_size > 0 ? Math.ceil(total_count / page_size) : 0
    )
    const page_index = normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index)

    return {
        items: pickItems(root).map(mapBooking),
        page_index,
        page_size,
        total_count,
        total_pages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])) || page_index > 1,
        has_next_page: page_index < total_pages
    }
}

export const facilityBookingService = {
    get_default_response: (filter?: Partial<FacilityBookingFilterModel>): FacilityBookingSearchResponse => ({
        ...empty_response,
        page_index: filter?.page_index ?? empty_response.page_index,
        page_size: filter?.page_size ?? empty_response.page_size
    }),

    simpleSearchFacilityBookings: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: FacilityBookingFilterModel
    }): Promise<FacilityBookingSearchResponse> => {
        if (!sessiontoken) return facilityBookingService.get_default_response(filter)

        const request: FacilityBookingSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: filter.project_id
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_BOOKINGS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facility bookings.')

        return mapFacilityBookingsSearchResponse(response, request)
    },

    getFacilityBookingById: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<FacilityBookingItem> => {
        if (!sessiontoken) throw new FacilityBookingWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_BOOKING_DETAIL_WORKFLOW_ID,
            input: { id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facility booking detail.')

        return mapFacilityBookingDetailResponse(response)
    },

    createFacilityBooking: (params: {
        sessiontoken?: string
        language?: Locale
        fields: CreateFacilityBookingRequest
    }) => runMutation({
        ...params,
        workflowid: FACILITY_BOOKING_CREATE_WORKFLOW_ID,
        fallback: 'Unable to create facility booking.'
    }),

    deactivateFacilityBooking: ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }) => runMutation({
        sessiontoken,
        language,
        workflowid: FACILITY_BOOKING_DEACTIVATE_WORKFLOW_ID,
        fields: { id },
        fallback: 'Unable to deactivate facility booking.'
    })
}
