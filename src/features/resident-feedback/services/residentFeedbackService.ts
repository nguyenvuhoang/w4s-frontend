import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
    ResidentFeedbackAttachment,
    ResidentFeedbackDetail,
    ResidentFeedbackItem,
    ResidentFeedbackMessage,
    ResidentFeedbackProjectOption,
    ResidentFeedbackFilter,
    ResidentFeedbackSearchRequest,
    ResidentFeedbackSearchResponse,
    ResidentFeedbackStatusLog
} from '../types'
import { ResidentFeedbackWorkflowError } from '../types'

// Resident feedback is searched through the shared service request list workflow,
// then loaded by request_code through its dedicated detail workflow.
export const RESIDENT_FEEDBACK_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_SERVICE_REQUESTS'
export const RESIDENT_FEEDBACK_DETAIL_WORKFLOW_ID = 'WF_BO_GET_SERVICE_REQUEST'
export const RESIDENT_FEEDBACK_PROJECTS_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'
export const RESIDENT_FEEDBACK_REQUEST_TYPE = 'FB'

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
    const root = pickDataRoot(response)

    return root?.request ?? root
}

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
}

const toNullableString = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

const toNullableNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
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
        throw new ResidentFeedbackWorkflowError(
            firstError?.info ?? firstError?.message ?? firstError?.description ?? dataresponse?.message ?? fallback,
            firstError?.next_action ?? dataresponse?.next_action,
            firstError?.code,
            firstError?.execution_id ?? dataresponse?.execution_id ?? data?.execution_id ?? response?.execution_id
        )
    }
}

export const mapResidentFeedback = (item: any): ResidentFeedbackItem => ({
    id: toNumber(getField(item, ['id'])),
    request_code: String(getField(item, ['request_code']) ?? ''),
    apartment_code: String(getField(item, ['apartment_code']) ?? ''),
    resident: toNullableString(getField(item, ['resident'])),
    category_code: String(getField(item, ['category_code']) ?? ''),
    content: toNullableString(getField(item, ['content'])),
    note: toNullableString(getField(item, ['note'])),
    assignment: toNullableString(getField(item, ['assignment'])),
    status: String(getField(item, ['status']) ?? ''),
    created_on_utc: toNullableString(getField(item, ['created_on_utc'])),
    requests_message: getField(item, ['requests_message'])
})

const mapResidentFeedbackAttachment = (item: any): ResidentFeedbackAttachment => ({
    file_name: String(getField(item, ['file_name', 'filename', 'name']) ?? ''),
    file_url: String(getField(item, ['file_url', 'url']) ?? ''),
    file_type: String(getField(item, ['file_type', 'content_type', 'mime_type']) ?? ''),
    is_result_attachment: toBoolean(getField(item, ['is_result_attachment']))
})

const mapResidentFeedbackMessage = (item: any): ResidentFeedbackMessage => ({
    content: String(getField(item, ['content', 'message', 'message_content']) ?? ''),
    sender_type: String(getField(item, ['sender_type', 'sender', 'created_by_type']) ?? ''),
    sent_on_utc: toNullableString(getField(item, ['sent_on_utc', 'created_on_utc', 'created_on']))
})

const mapResidentFeedbackStatusLog = (item: any): ResidentFeedbackStatusLog => ({
    status: String(getField(item, ['status', 'request_status', 'new_status']) ?? ''),
    note: toNullableString(getField(item, ['note', 'internal_note', 'reason', 'description'])),
    created_by: toNullableString(getField(item, ['created_by', 'created_by_user_code', 'user_code'])),
    created_on_utc: toNullableString(getField(item, ['created_on_utc', 'created_on', 'updated_on_utc']))
})

const mapArray = <T>(value: unknown, mapper: (item: any) => T): T[] => {
    const container = value && typeof value === 'object' ? value as Record<string, unknown> : null
    const items = Array.isArray(value) ? value : Array.isArray(container?.items) ? container.items : []

    return items.flatMap(item => item && typeof item === 'object' ? [mapper(item)] : [])
}

export const mapResidentFeedbackDetail = (item: any, requestCode: string): ResidentFeedbackDetail => ({
    request_code: String(getField(item, ['request_code']) ?? requestCode),
    project_code: String(getField(item, ['project_code']) ?? ''),
    apartment_code: String(getField(item, ['apartment_code']) ?? ''),
    resident_code: String(getField(item, ['resident_code', 'user_code']) ?? ''),
    request_type: String(getField(item, ['request_type']) ?? ''),
    category_code: String(getField(item, ['category_code']) ?? ''),
    title: String(getField(item, ['title']) ?? ''),
    content: toNullableString(getField(item, ['content'])),
    status: String(getField(item, ['status']) ?? ''),
    priority: String(getField(item, ['priority']) ?? ''),
    scheduled_date: toNullableString(getField(item, ['scheduled_date'])),
    completed_on_utc: toNullableString(getField(item, ['completed_on_utc'])),
    cancel_reason: toNullableString(getField(item, ['cancel_reason'])),
    rating: toNullableNumber(getField(item, ['rating'])),
    rating_comment: toNullableString(getField(item, ['rating_comment'])),
    attachments: mapArray(getField(item, ['attachments']), mapResidentFeedbackAttachment),
    messages: mapArray(getField(item, ['messages']), mapResidentFeedbackMessage).sort((left, right) => {
        const leftTime = left.sent_on_utc ? new Date(left.sent_on_utc).getTime() : 0
        const rightTime = right.sent_on_utc ? new Date(right.sent_on_utc).getTime() : 0

        return leftTime - rightTime
    }),
    status_logs: mapArray(getField(item, ['status_logs']), mapResidentFeedbackStatusLog).sort((left, right) => {
        const leftTime = left.created_on_utc ? new Date(left.created_on_utc).getTime() : 0
        const rightTime = right.created_on_utc ? new Date(right.created_on_utc).getTime() : 0

        return leftTime - rightTime
    })
})

export const mapResidentFeedbackSearchResponse = (
    response: any,
    request: ResidentFeedbackSearchRequest
): ResidentFeedbackSearchResponse => {
    const root = pickDataRoot(response)
    const totalCount = toNumber(getField(root, ['total_count', 'total_items']))
    const pageSize = toNumber(getField(root, ['page_size']), request.page_size)
    const responseTotalPages = toNumber(getField(root, ['total_pages']))
    const calculatedTotalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0

    const items = pickItems(root).map(mapResidentFeedback)

    return {
        items,
        total_count: totalCount,
        total_pages: responseTotalPages > 0 ? responseTotalPages : calculatedTotalPages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page'])),
        has_next_page: toBoolean(getField(root, ['has_next_page'])),
        page_index: toNumber(getField(root, ['page_index']), request.page_index),
        page_size: pageSize
    }
}

const mapProjectOptions = (response: any): ResidentFeedbackProjectOption[] => {
    const root = pickDataRoot(response)

    return pickItems(root).flatMap(item => {
        const id = toNumber(getField(item, ['id', 'project_id']))

        if (id <= 0) return []

        const code = String(getField(item, ['project_code', 'code']) ?? '').trim()
        const name = String(getField(item, ['project_name', 'name', 'caption']) ?? (code || id)).trim()
        const status = String(getField(item, ['status']) ?? '').trim()
        const address = String(getField(item, ['address']) ?? '').trim()

        return [{ id, code, name, status, address }]
    })
}

export const residentFeedbackService = {
    getDefaultResponse: (filter?: Partial<ResidentFeedbackFilter>): ResidentFeedbackSearchResponse => ({
        items: [],
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false,
        page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }),

    simpleSearchResidentFeedback: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: ResidentFeedbackFilter
    }): Promise<ResidentFeedbackSearchResponse> => {
        if (!sessiontoken) return residentFeedbackService.getDefaultResponse(filter)

        const request: ResidentFeedbackSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index, 0),
            request_status: filter.request_status,
            search_text: filter.search_text.trim(),
            project_id: Number(filter.project_id),
            request_type: RESIDENT_FEEDBACK_REQUEST_TYPE
        }
        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: RESIDENT_FEEDBACK_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load resident feedback.')

        return mapResidentFeedbackSearchResponse(response, request)
    },

    simpleSearchProjects: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<ResidentFeedbackProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: RESIDENT_FEEDBACK_PROJECTS_WORKFLOW_ID,
            input: { search_text: '', page_index: 0, page_size: 100 },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        return mapProjectOptions(response)
    },

    getResidentFeedbackDetail: async ({
        sessiontoken,
        language,
        request_code
    }: {
        sessiontoken?: string
        language?: Locale
        request_code: string
    }): Promise<ResidentFeedbackDetail | null> => {
        if (!sessiontoken || !request_code) return null

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: RESIDENT_FEEDBACK_DETAIL_WORKFLOW_ID,
            input: { request_code },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load resident feedback detail.')

        const request = pickRequestDetail(response)

        if (!request || typeof request !== 'object') return null

        return mapResidentFeedbackDetail(request, request_code)
    }
}
