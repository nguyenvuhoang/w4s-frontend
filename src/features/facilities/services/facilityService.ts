import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

import type {
    CreatedFacilityDetail,
    CreateFacilityRequest,
    DeactivateFacilityRequest,
    FacilityCategoriesFilterModel,
    FacilityCategoryDetail,
    FacilityCategoryItem,
    FacilityCategorySearchRequest,
    FacilityCategorySearchResponse,
    FacilityProjectOption,
    FacilityProjectSearchResponse,
    CreateFacilitySetupRequest,
    FacilityTimeSlotItem,
    FacilityTimeSlotsFilterModel,
    FacilityTimeSlotsSearchRequest,
    FacilityTimeSlotsSearchResponse,
    FacilitiesFilterModel,
    FacilitiesSearchRequest,
    FacilitiesSearchResponse,
    FacilityItem,
    UpdatedFacilityDetail,
    UpdateFacilityRequest
} from '../types'

export const FACILITIES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FACILITIES'
export const FACILITY_TIME_SLOTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FACILITY_TIME_SLOTS'
export const FACILITY_CATEGORIES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FACILITY_CATEGORIES'
export const FACILITY_CATEGORY_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FACILITY_CATEGORY_BY_ID'
export const FACILITY_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FACILITY_SETUP'
export const FACILITY_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_FACILITY'
export const FACILITY_DEACTIVATE_WORKFLOW_ID = 'WF_BO_DELETE_FACILITY'
export const PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'

const empty_facilities_response: FacilitiesSearchResponse = {
    items: [],
    page_index: 0,
    page_size: 10,
    total_count: 0,
    total_pages: 0
}

const empty_facility_categories_response: FacilityCategorySearchResponse = {
    items: [],
    page_index: 0,
    page_size: 10,
    total_count: 0,
    total_pages: 0
}

const empty_facility_time_slots_response: FacilityTimeSlotsSearchResponse = {
    items: [],
    page_index: 0,
    page_size: 10,
    total_count: 0,
    total_pages: 0
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

const normalizeResponsePage = (value: any, request_page_index: number) => {
    const page_index = toNumber(value, request_page_index + 1)

    return page_index <= 0 ? page_index + 1 : page_index
}

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
        throw new Error(getWorkflowErrorMessage(response, fallback))
    }
}

const mapFacility = (item: any): FacilityItem => ({
    id: toNullableNumber(getField(item, ['id', 'facility_id', 'facilityId'])) ?? undefined,
    facility_code: String(getField(item, ['facility_code', 'facilityCode']) ?? ''),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    facility_category_id: toNullableNumber(getField(item, ['facility_category_id', 'facilityCategoryId'])),
    facility_category_code: String(
        getField(item, ['facility_category_code', 'facilityCategoryCode', 'category_code', 'categoryCode']) ?? ''
    ).trim() || null,
    facility_category_name: String(
        getField(item, ['facility_category_name', 'facilityCategoryName', 'category_name', 'categoryName']) ?? ''
    ) || null,
    name: String(getField(item, ['name', 'facility_name', 'facilityName']) ?? ''),
    description: getField(item, ['description']) ?? null,
    image_url: getField(item, ['image_url', 'imageUrl']) ?? null,
    terms_url: getField(item, ['terms_url', 'termsUrl']) ?? null,
    require_deposit: toBoolean(getField(item, ['require_deposit', 'requireDeposit'])),
    deposit_amount: toNullableNumber(getField(item, ['deposit_amount', 'depositAmount'])),
    max_slots_per_day: toNullableNumber(getField(item, ['max_slots_per_day', 'maxSlotsPerDay'])),
    advance_booking_days: toNullableNumber(getField(item, ['advance_booking_days', 'advanceBookingDays'])),
    display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
    status: String(getField(item, ['status']) ?? '')
})

const mapFacilityCategory = (item: any): FacilityCategoryItem => {
    const category_id = toNullableNumber(
        getField(item, ['id', 'facility_category_id', 'facilityCategoryId', 'category_id', 'categoryId'])
    )

    if (category_id === null) {
        // TODO: WF_BO_SIMPLE_SEARCH_FACILITY_CATEGORIES must return a real category ID.
    }

    return {
        id: category_id ?? undefined,
        facility_category_id: category_id ?? undefined,
        category_code: String(getField(item, ['category_code', 'categoryCode', 'facility_category_code', 'facilityCategoryCode']) ?? ''),
        project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
        name: String(getField(item, ['name', 'category_name', 'categoryName', 'facility_category_name', 'facilityCategoryName']) ?? ''),
        icon_url: getField(item, ['icon_url', 'iconUrl']) ?? null,
        display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
        status: String(getField(item, ['status']) ?? '')
    }
}

const mapFacilityTimeSlot = (item: any): FacilityTimeSlotItem => ({
    id: toNullableNumber(getField(item, ['id', 'facility_time_slot_id', 'facilityTimeSlotId'])) ?? undefined,
    facility_id: toNumber(getField(item, ['facility_id', 'facilityId']), 0),
    name: String(getField(item, ['name', 'time_slot_name', 'timeSlotName']) ?? ''),
    start_time: getField(item, ['start_time', 'startTime']) ?? null,
    end_time: getField(item, ['end_time', 'endTime']) ?? null,
    max_capacity: toNullableNumber(getField(item, ['max_capacity', 'maxCapacity'])),
    day_of_week: toNullableNumber(getField(item, ['day_of_week', 'dayOfWeek'])),
    base_price: toNullableNumber(getField(item, ['base_price', 'basePrice', 'price'])),
    status: String(getField(item, ['status']) ?? '')
})

const mapProjectOption = (item: any): FacilityProjectOption | null => {
    const id = toNullableNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']))

    if (id === null) return null

    const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
    const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name', 'caption']) ?? (code || id)).trim()

    return {
        id,
        code,
        name,
        status: String(getField(item, ['status']) ?? ''),
        address: String(getField(item, ['address']) ?? '')
    }
}

const mapProjectsSearchResponse = (response: any): FacilityProjectOption[] => {
    const root = pickDataRoot(response?.payload ?? response)
    const by_id = new Map<number, FacilityProjectOption>()

    pickItems(root).forEach(item => {
        const option = mapProjectOption(item)

        if (option) by_id.set(option.id, option)
    })

    return Array.from(by_id.values())
}

const mapFacilityCategoryDetail = (response: any): FacilityCategoryDetail => {
    const root = pickDataRoot(response?.payload ?? response)

    return mapFacilityCategory(root)
}

const mapCreatedFacility = (item: any, fallback: CreateFacilityRequest): CreatedFacilityDetail => ({
    ...fallback,
    id: toNullableNumber(getField(item, ['id', 'facility_id', 'facilityId'])) ?? undefined,
    description: String(getField(item, ['description']) ?? fallback.description),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), fallback.project_id),
    deposit_amount: getField(item, ['deposit_amount', 'depositAmount']) ?? fallback.deposit_amount,
    max_slots_per_day: getField(item, ['max_slots_per_day', 'maxSlotsPerDay']) ?? fallback.max_slots_per_day,
    name: String(getField(item, ['name', 'facility_name', 'facilityName']) ?? fallback.name),
    image_url: String(getField(item, ['image_url', 'imageUrl']) ?? fallback.image_url),
    advance_booking_days: getField(item, ['advance_booking_days', 'advanceBookingDays']) ?? fallback.advance_booking_days,
    facility_code: String(getField(item, ['facility_code', 'facilityCode']) ?? fallback.facility_code),
    display_order: toNumber(getField(item, ['display_order', 'displayOrder']), fallback.display_order),
    terms_url: String(getField(item, ['terms_url', 'termsUrl']) ?? fallback.terms_url),
    facility_category_id: toNumber(getField(item, ['facility_category_id', 'facilityCategoryId']), fallback.facility_category_id),
    require_deposit: getField(item, ['require_deposit', 'requireDeposit']) === undefined
        ? fallback.require_deposit
        : toBoolean(getField(item, ['require_deposit', 'requireDeposit'])),
    status: getField(item, ['status']) ? String(getField(item, ['status'])) : undefined
})

const hasFacilityDetail = (item: any) => getField(item, [
    'id',
    'facility_id',
    'facilityId',
    'facility_code',
    'facilityCode',
    'name',
    'facility_name',
    'facilityName'
]) !== undefined

const pickMutationFields = (response: any) => {
    const payload = response?.payload ?? response
    const root = pickDataRoot(payload)
    const candidates = [
        root?.fields,
        root?.result?.fields,
        root?.result,
        root?.txbody?.fields,
        root?.txbody,
        payload?.fields,
        payload?.result?.fields,
        payload?.result,
        payload?.txbody?.fields,
        payload?.txbody,
        payload?.data?.fields,
        payload?.data?.result?.fields,
        payload?.data?.result,
        root
    ]

    for (const candidate of candidates) {
        const item = Array.isArray(candidate) ? candidate[0] : candidate

        if (hasFacilityDetail(item)) return item
    }

    return null
}

const mapCreatedFacilityResponse = (response: any, fallback: CreateFacilityRequest): CreatedFacilityDetail => {
    const item = pickMutationFields(response)

    return mapCreatedFacility(item ?? fallback, fallback)
}

const mapUpdatedFacility = (item: any, fallback: UpdateFacilityRequest): UpdatedFacilityDetail => ({
    id: toNumber(getField(item, ['id', 'facility_id', 'facilityId']), fallback.id),
    display_order: toNumber(getField(item, ['display_order', 'displayOrder']), fallback.display_order),
    name: String(getField(item, ['name', 'facility_name', 'facilityName']) ?? fallback.name),
    deposit_amount: getField(item, ['deposit_amount', 'depositAmount']) ?? fallback.deposit_amount,
    status: String(getField(item, ['status']) ?? fallback.status),
    facility_category_id: toNumber(getField(item, ['facility_category_id', 'facilityCategoryId']), fallback.facility_category_id),
    max_slots_per_day: getField(item, ['max_slots_per_day', 'maxSlotsPerDay']) ?? fallback.max_slots_per_day,
    // TODO: Confirm whether backend field facility_category_code should be facility_code for this update workflow.

    facility_code: String(
        getField(item, ['facility_code', 'facilityCode'])
        ?? ''
    ),
    image_url: String(getField(item, ['image_url', 'imageUrl']) ?? fallback.image_url),
    terms_url: String(getField(item, ['terms_url', 'termsUrl']) ?? fallback.terms_url),
    require_deposit: getField(item, ['require_deposit', 'requireDeposit']) === undefined
        ? fallback.require_deposit
        : toBoolean(getField(item, ['require_deposit', 'requireDeposit'])),
    advance_booking_days: getField(item, ['advance_booking_days', 'advanceBookingDays']) ?? fallback.advance_booking_days,
    description: String(getField(item, ['description']) ?? fallback.description),
    project_id: toNullableNumber(getField(item, ['project_id', 'projectId'])) ?? undefined
})

const mapUpdatedFacilityResponse = (response: any, fallback: UpdateFacilityRequest): UpdatedFacilityDetail => {
    const item = pickMutationFields(response)

    return mapUpdatedFacility(item ?? fallback, fallback)
}

const mapCreateFacilityWorkflowFields = (fields: CreateFacilitySetupRequest) => ({
    facility: {
        FacilityCode: fields.facility.facility_code,
        ProjectId: fields.facility.project_id,
        FacilityCategoryId: fields.facility.facility_category_id,
        Name: fields.facility.name,
        Description: fields.facility.description,
        ImageUrl: fields.facility.image_url,
        TermsUrl: fields.facility.terms_url,
        NeedAcceptPolicy: fields.facility.need_accept_policy,
        FacilityPolicy: fields.facility.facility_policy,
        RequireDeposit: fields.facility.require_deposit,
        DepositAmount: fields.facility.deposit_amount,
        MaxSlotsPerDay: fields.facility.max_slots_per_day,
        AdvanceBookingDays: fields.facility.advance_booking_days,
        BuildingId: fields.facility.building_id,
        Location: fields.facility.location,
        PricePerHour: fields.facility.price_per_hour,
        OpenTime: fields.facility.open_time,
        CloseTime: fields.facility.close_time,
        MaxCapacity: fields.facility.max_capacity,
        LongDescription: fields.facility.long_description,
        Rules: fields.facility.rules,
        MaxPeoplePerBooking: fields.facility.max_people_per_booking,
        MaxSlotsPerBooking: fields.facility.max_slots_per_booking,
        PriceNote: fields.facility.price_note,
        DisplayOrder: fields.facility.display_order
    },
    time_slots: fields.time_slots.map(slot => ({
        Id: slot.id,
        Name: slot.name,
        StartTime: slot.start_time,
        EndTime: slot.end_time,
        MaxCapacity: slot.max_capacity,
        DayOfWeek: slot.day_of_week,
        BasePrice: slot.base_price
    })),
    price_rules: fields.price_rules.map(rule => ({
        Id: rule.id,
        ...(rule.time_slot_index === undefined ? {} : { TimeSlotIndex: rule.time_slot_index }),
        RuleType: rule.rule_type,
        ...(rule.specific_date ? { SpecificDate: rule.specific_date } : {}),
        PriceAdjustmentType: rule.price_adjustment_type,
        AdjustmentValue: rule.adjustment_value,
        Priority: rule.priority
    }))
})

export const mapFacilitiesSearchResponse = (
    response: any,
    request: FacilitiesSearchRequest
): FacilitiesSearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        page_size > 0 ? Math.ceil(total_count / page_size) : 0
    )

    return {
        items: pickItems(root).map(mapFacility),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

export const mapFacilityCategoriesSearchResponse = (
    response: any,
    request: FacilityCategorySearchRequest
): FacilityCategorySearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        page_size > 0 ? Math.ceil(total_count / page_size) : 0
    )

    return {
        items: pickItems(root).map(mapFacilityCategory),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

export const mapFacilityTimeSlotsSearchResponse = (
    response: any,
    request: FacilityTimeSlotsSearchRequest
): FacilityTimeSlotsSearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        page_size > 0 ? Math.ceil(total_count / page_size) : 0
    )

    return {
        items: pickItems(root).map(mapFacilityTimeSlot),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

export const facilityService = {
    get_default_response: (filter?: Partial<FacilitiesFilterModel>): FacilitiesSearchResponse => ({
        ...empty_facilities_response,
        page_index: filter?.page_index ?? empty_facilities_response.page_index,
        page_size: filter?.page_size ?? empty_facilities_response.page_size
    }),

    get_default_category_response: (filter?: Partial<FacilityCategoriesFilterModel>): FacilityCategorySearchResponse => ({
        ...empty_facility_categories_response,
        page_index: filter?.page_index ?? empty_facility_categories_response.page_index,
        page_size: filter?.page_size ?? empty_facility_categories_response.page_size
    }),

    get_default_time_slot_response: (filter?: Partial<FacilityTimeSlotsFilterModel>): FacilityTimeSlotsSearchResponse => ({
        ...empty_facility_time_slots_response,
        page_index: filter?.page_index ?? empty_facility_time_slots_response.page_index,
        page_size: filter?.page_size ?? empty_facility_time_slots_response.page_size
    }),

    simpleSearchFacilities: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: FacilitiesFilterModel
    }): Promise<FacilitiesSearchResponse> => {
        if (!sessiontoken) return facilityService.get_default_response(filter)

        const request: FacilitiesSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: filter.project_id
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITIES_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facilities.')

        return mapFacilitiesSearchResponse(response, request)
    },

    simpleSearchFacilityCategories: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: FacilityCategoriesFilterModel
    }): Promise<FacilityCategorySearchResponse> => {
        if (!sessiontoken) return facilityService.get_default_category_response(filter)

        const request: FacilityCategorySearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: filter.project_id
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_CATEGORIES_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facility categories.')

        return mapFacilityCategoriesSearchResponse(response, request)
    },

    simpleSearchFacilityTimeSlots: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: FacilityTimeSlotsFilterModel
    }): Promise<FacilityTimeSlotsSearchResponse> => {
        if (!sessiontoken) return facilityService.get_default_time_slot_response(filter)

        const request: FacilityTimeSlotsSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            facility_id: filter.facility_id
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_TIME_SLOTS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facility time slots.')

        return mapFacilityTimeSlotsSearchResponse(response, request)
    },

    getFacilityCategoryById: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<FacilityCategoryDetail> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_CATEGORY_DETAIL_WORKFLOW_ID,
            input: { id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load facility category detail.')

        return mapFacilityCategoryDetail(response)
    },

    simpleSearchProjects: async ({
        sessiontoken,
        language,
        search_text = '',
        page_size = 100
    }: {
        sessiontoken?: string
        language?: Locale
        search_text?: string
        page_size?: number
    }): Promise<FacilityProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: PROJECTS_SEARCH_WORKFLOW_ID,
            input: {
                search_text,
                page_index: 0,
                page_size
            },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        return mapProjectsSearchResponse(response)
    },

    searchProjectsPaged: async ({
        sessiontoken,
        language,
        search_text = '',
        page_index = 1,
        page_size = 12
    }: {
        sessiontoken?: string
        language?: Locale
        search_text?: string
        page_index?: number
        page_size?: number
    }): Promise<FacilityProjectSearchResponse> => {
        const empty_response: FacilityProjectSearchResponse = {
            items: [],
            page_index,
            page_size,
            total_count: 0,
            total_pages: 0,
            has_next_page: false
        }

        if (!sessiontoken) return empty_response

        const request = {
            search_text: search_text.trim(),
            page_index: Math.max(page_index - 1, 0),
            page_size
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: PROJECTS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        const root = pickDataRoot(response?.payload ?? response)
        const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
        const resolved_page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
        const total_pages = toNumber(
            getField(root, ['total_pages', 'totalPages']),
            resolved_page_size > 0 ? Math.ceil(total_count / resolved_page_size) : 0
        )

        return {
            items: mapProjectsSearchResponse(response),
            page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
            page_size: resolved_page_size,
            total_count,
            total_pages,
            has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
        }
    },

    createFacility: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: CreateFacilitySetupRequest
    }): Promise<CreatedFacilityDetail | null> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_CREATE_WORKFLOW_ID,
            input: mapCreateFacilityWorkflowFields(fields),
            language
        })

        assertWorkflowSuccess(response, 'Unable to create facility.')

        return mapCreatedFacilityResponse(response, fields.facility)
    },

    updateFacility: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: UpdateFacilityRequest
    }): Promise<UpdatedFacilityDetail | null> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!Number.isInteger(fields.facility_category_id) || fields.facility_category_id <= 0) {
            throw new Error('A valid facility_category_id is required to update a facility.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_UPDATE_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to update facility.')

        return mapUpdatedFacilityResponse(response, fields)
    },

    deactivateFacility: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<void> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('A valid facility ID is required.')
        }

        const fields: DeactivateFacilityRequest = { id }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: FACILITY_DEACTIVATE_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to deactivate facility.')
    }
}
