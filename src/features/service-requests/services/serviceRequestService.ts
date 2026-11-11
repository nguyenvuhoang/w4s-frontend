import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
    AssignServiceRequestRequest,
    AssignServiceRequestResponse,
    CancelServiceRequestRequest,
    CreateServiceRequestRequest,
    DeactivateServiceRequestRequest,
    ServiceRequestDetail,
    ServiceRequestAttachment,
    ServiceRequestItem,
    ServiceRequestMessage,
    ServiceRequestProjectOption,
    ServiceRequestStatusLog,
    ServiceRequestsFilter,
    ServiceRequestsSearchRequest,
    ServiceRequestsSearchResponse,
    UpdateServiceRequestStatusRequest,
    UpdateServiceRequestStatusResponse
} from '../types'
import { ServiceRequestWorkflowError } from '../types'

export const SERVICE_REQUESTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_SERVICE_REQUESTS'
export const SERVICE_REQUEST_PROJECTS_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'
export const SERVICE_REQUEST_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_SERVICE_REQUEST'
export const SERVICE_REQUEST_DEACTIVATE_WORKFLOW_ID = 'WF_BO_DELETE_SERVICE_REQUEST'
export const SERVICE_REQUEST_STATUS_WORKFLOW_ID = 'WF_BO_UPDATE_SERVICE_REQUEST_STATUS'
export const SERVICE_REQUEST_ASSIGN_WORKFLOW_ID = 'WF_BO_ASSIGN_SERVICE_REQUEST'
export const SERVICE_REQUEST_CANCEL_WORKFLOW_ID = 'WF_BO_CANCEL_SERVICE_REQUEST'
export const SERVICE_REQUEST_DETAIL_WORKFLOW_ID = 'WF_BO_GET_SERVICE_REQUEST'

// This screen is "Service Requests" management — only request_type = SR belongs here.
// Resident feedback (request_type = FB) has its own screen at /feedback/resident-feedback.
export const SERVICE_REQUESTS_REQUEST_TYPE = 'SR'

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const normalized = Object.keys(item).reduce<Record<string, any>>((values, key) => {
        values[normalizeKey(key)] = item[key]

        return values
    }, {})

    for (const key of keys) {
        const value = normalized[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const pickDataRoot = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response

    return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(root?.input?.items)) return root.input.items

    return []
}

const pickRequestDetail = (response: any) => {
    const request = response?.data?.request

    if (request && typeof request === 'object') return request

    const root = pickDataRoot(response)

    return root?.request ?? root
}

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
}

const toNullableNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

const toNullableString = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    return String(value)
}

const toBoolean = (value: unknown) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const assertWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const firstError = Array.isArray(errors) ? errors[0] : undefined
    const failed = response?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if (firstError || failed) {
        throw new ServiceRequestWorkflowError(
            firstError?.info ?? firstError?.message ?? firstError?.description ?? dataresponse?.message ?? fallback,
            firstError?.next_action ?? dataresponse?.next_action,
            firstError?.code
        )
    }
}

type MutationFields = CreateServiceRequestRequest
    | DeactivateServiceRequestRequest
    | CancelServiceRequestRequest

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
    fields: MutationFields
    fallback: string
}) => {
    if (!sessiontoken) throw new ServiceRequestWorkflowError('Session is required.', 'logout')

    const response = await workflowService.runFODynamic({
        sessiontoken,
        workflowid,
        input: fields,
        language
    })

    assertWorkflowSuccess(response, fallback)
}

const normalizeResponsePage = (value: unknown, requestPage: number) => {
    const responsePage = toNumber(value, requestPage + 1)

    return responsePage <= 0 ? responsePage + 1 : responsePage
}

export const mapServiceRequest = (item: any): ServiceRequestItem => ({
    id: toNumber(getField(item, ['id'])),
    project_id: toNumber(getField(item, ['project_id'])),
    apartment_id: toNumber(getField(item, ['apartment_id'])),
    service_request_category_id: toNumber(getField(item, ['service_request_category_id'])),
    request_code: String(getField(item, ['request_code']) ?? ''),
    project_code: String(getField(item, ['project_code']) ?? ''),
    request_type: String(getField(item, ['request_type']) ?? ''),
    apartment_code: String(getField(item, ['apartment_code']) ?? ''),
    category_code: String(getField(item, ['category_code']) ?? ''),
    title: String(getField(item, ['title']) ?? ''),
    status: String(getField(item, ['status']) ?? ''),
    priority: String(getField(item, ['priority']) ?? ''),
    scheduled_date: getField(item, ['scheduled_date']) ?? null,
    completed_on_utc: getField(item, ['completed_on_utc']) ?? null,
    rating: toNullableNumber(getField(item, ['rating']))
})

const mapServiceRequestAttachment = (item: any): ServiceRequestAttachment => ({
    file_name: String(getField(item, ['file_name', 'filename', 'name']) ?? ''),
    file_url: String(getField(item, ['file_url', 'url']) ?? ''),
    file_type: String(getField(item, ['file_type', 'content_type', 'mime_type']) ?? ''),
    is_result_attachment: toBoolean(getField(item, ['is_result_attachment']))
})

const mapServiceRequestMessage = (item: any): ServiceRequestMessage => ({
    sender_type: String(getField(item, ['sender_type']) ?? '').toUpperCase(),
    content: String(getField(item, ['content']) ?? ''),
    sent_on_utc: toNullableString(getField(item, ['sent_on_utc'])),
    attachments: Array.isArray(item?.attachments)
        ? item.attachments.map(mapServiceRequestAttachment)
        : []
})

const mapServiceRequestStatusLog = (item: any): ServiceRequestStatusLog => ({
    from_status: String(getField(item, ['from_status']) ?? ''),
    to_status: String(getField(item, ['to_status']) ?? ''),
    changed_by_user_code: toNullableString(getField(item, ['changed_by_user_code'])),
    note: toNullableString(getField(item, ['note'])),
    changed_on_utc: toNullableString(getField(item, ['changed_on_utc']))
})

export const mapServiceRequestsSearchResponse = (
    response: any,
    request: ServiceRequestsSearchRequest
): ServiceRequestsSearchResponse => {
    const root = pickDataRoot(response)
    const totalCount = toNumber(getField(root, ['total_count', 'total_items']))
    const pageSize = toNumber(getField(root, ['page_size']), request.page_size)
    const responseTotalPages = toNumber(getField(root, ['total_pages']))
    const calculatedTotalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0

    // Backend may not filter by request_type yet, so keep this client-side guard to hide "FB" rows.
    const items = pickItems(root)
        .map(mapServiceRequest)
        .filter(item => item.request_type === SERVICE_REQUESTS_REQUEST_TYPE)

    return {
        items,
        total_count: totalCount,
        total_pages: responseTotalPages > 0 ? responseTotalPages : calculatedTotalPages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page'])),
        has_next_page: toBoolean(getField(root, ['has_next_page'])),
        page_index: normalizeResponsePage(getField(root, ['page_index']), request.page_index),
        page_size: pageSize
    }
}

export const mapServiceRequestDetail = (request: any, fallbackId: number): ServiceRequestDetail => {
    const attachments = Array.isArray(request?.attachments)
        ? request.attachments
        : []
    const messages = Array.isArray(request?.messages)
        ? request.messages
        : []
    const statusLogs = Array.isArray(request?.status_logs)
        ? request.status_logs
        : []

    return {
        id: toNumber(getField(request, ['id']), fallbackId),
        request_code: String(getField(request, ['request_code']) ?? ''),
        project_id: toNumber(getField(request, ['project_id'])),
        request_type: String(getField(request, ['request_type']) ?? ''),
        resident_id: toNullableNumber(getField(request, ['resident_id'])),
        user_code: toNullableString(getField(request, ['user_code'])),
        apartment_id: toNullableNumber(getField(request, ['apartment_id'])),
        service_request_category_id: toNullableNumber(getField(request, ['service_request_category_id'])),
        title: String(getField(request, ['title']) ?? ''),
        content: toNullableString(getField(request, ['content'])),
        status: String(getField(request, ['status']) ?? ''),
        priority: String(getField(request, ['priority']) ?? ''),
        handler_user_code: toNullableString(getField(request, ['handler_user_code'])),
        supervisor_user_code: toNullableString(getField(request, ['supervisor_user_code'])),
        internal_note: toNullableString(getField(request, ['internal_note'])),
        cancel_reason: toNullableString(getField(request, ['cancel_reason'])),
        is_hidden_from_resident: toBoolean(getField(request, ['is_hidden_from_resident'])),
        is_visible_on_app: toBoolean(getField(request, ['is_visible_on_app'])),
        scheduled_date: getField(request, ['scheduled_date']) ?? null,
        completed_on_utc: getField(request, ['completed_on_utc']) ?? null,
        rating: toNullableNumber(getField(request, ['rating'])),
        rating_comment: toNullableString(getField(request, ['rating_comment'])),
        attachments: attachments.map(mapServiceRequestAttachment),
        messages: messages.map(mapServiceRequestMessage),
        status_logs: statusLogs.map(mapServiceRequestStatusLog)
    }
}

const mapAssignServiceRequestResponse = (
    response: any,
    request: AssignServiceRequestRequest
): AssignServiceRequestResponse => {
    const root = pickDataRoot(response)

    return {
        request_code: toNullableString(getField(root, ['request_code'])) ?? request.request_code,
        handler_user_code: toNullableString(getField(root, ['handler_user_code'])) ?? request.handler_user_code,
        supervisor_user_code: toNullableString(getField(root, ['supervisor_user_code'])) ?? (request.supervisor_user_code || null),
        status: String(getField(root, ['status']) ?? '')
    }
}

const mapUpdateServiceRequestStatusResponse = (
    response: any,
    request: UpdateServiceRequestStatusRequest
): UpdateServiceRequestStatusResponse => {
    const root = pickDataRoot(response)

    return {
        request_code: toNullableString(getField(root, ['request_code'])) ?? request.request_code,
        status: toNullableString(getField(root, ['status'])) ?? request.request_status
    }
}

const mapProjectOptions = (response: any): ServiceRequestProjectOption[] => {
    const root = pickDataRoot(response)

    return pickItems(root).flatMap(item => {
        const id = toNumber(getField(item, ['id', 'project_id']))

        if (id <= 0) return []

        const code = String(getField(item, ['project_code', 'code']) ?? '').trim()
        const name = String(getField(item, ['project_name', 'name', 'caption']) ?? (code || id)).trim()

        return [{ id, code, name }]
    })
}

export const serviceRequestService = {
    getDefaultResponse: (filter?: Partial<ServiceRequestsFilter>): ServiceRequestsSearchResponse => ({
        items: [],
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false,
        page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }),

    simpleSearchServiceRequests: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: ServiceRequestsFilter
    }): Promise<ServiceRequestsSearchResponse> => {
        if (!sessiontoken) return serviceRequestService.getDefaultResponse(filter)

        const request: ServiceRequestsSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            request_status: filter.request_status,
            search_text: filter.search_text.trim(),
            project_id: Number(filter.project_id),
            request_type: SERVICE_REQUESTS_REQUEST_TYPE
        }
        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SERVICE_REQUESTS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load service requests.')

        return mapServiceRequestsSearchResponse(response, request)
    },

    simpleSearchProjects: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<ServiceRequestProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SERVICE_REQUEST_PROJECTS_WORKFLOW_ID,
            input: { search_text: '', page_index: 0, page_size: 100 },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        return mapProjectOptions(response)
    },

    createServiceRequest: (params: {
        sessiontoken?: string
        language?: Locale
        fields: CreateServiceRequestRequest
    }) => runMutation({
        ...params,
        workflowid: SERVICE_REQUEST_CREATE_WORKFLOW_ID,
        fallback: 'Unable to create service request.'
    }),

    deactivateServiceRequest: ({
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
        workflowid: SERVICE_REQUEST_DEACTIVATE_WORKFLOW_ID,
        fields: { id },
        fallback: 'Unable to deactivate service request.'
    }),

    updateServiceRequestStatus: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: UpdateServiceRequestStatusRequest
    }): Promise<UpdateServiceRequestStatusResponse> => {
        if (!sessiontoken) throw new ServiceRequestWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SERVICE_REQUEST_STATUS_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to update service request status.')

        return mapUpdateServiceRequestStatusResponse(response, fields)
    },

    assignServiceRequest: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: AssignServiceRequestRequest
    }): Promise<AssignServiceRequestResponse> => {
        if (!sessiontoken) throw new ServiceRequestWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SERVICE_REQUEST_ASSIGN_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to assign service request.')

        return mapAssignServiceRequestResponse(response, fields)
    },

    cancelServiceRequest: (params: {
        sessiontoken?: string
        language?: Locale
        fields: CancelServiceRequestRequest
    }) => runMutation({
        ...params,
        workflowid: SERVICE_REQUEST_CANCEL_WORKFLOW_ID,
        fallback: 'Unable to cancel service request.'
    }),

    getServiceRequestByCode: async ({
        sessiontoken,
        language,
        requestCode
    }: {
        sessiontoken?: string
        language?: Locale
        requestCode: string
    }): Promise<ServiceRequestDetail | null> => {
        const request_code = requestCode.trim()

        if (!sessiontoken || !request_code) return null

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SERVICE_REQUEST_DETAIL_WORKFLOW_ID,
            input: { request_code },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load service request detail.')

        const root = pickRequestDetail(response)

        if (!root || typeof root !== 'object') return null

        const request = mapServiceRequestDetail(root, 0)


        return request
    }
}
