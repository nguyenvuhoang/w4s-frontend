import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type { UserSessionItem, UserSessionSearchRequest, UserSessionSearchResponse } from '../types'

type SearchParams = {
    sessiontoken?: string
    language?: Locale
    filter: {
        search_text: string
        channel_code: 'BO'
        page_index: number
        page_size: number
    }
}

const toNumber = (value: unknown, fallback = 0) => {
    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : fallback
}

const toBoolean = (value: unknown) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    return undefined
}

const getResponseRoot = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response

    return data?.data ?? data?.input?.data ?? data?.input ?? data
}

const getErrors = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse

    return dataresponse?.errors ?? dataresponse?.error ?? response?.payload?.errors ?? response?.errors ?? []
}

const getWorkflowErrorMessage = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const root = getResponseRoot(response)
    const errors = getErrors(response)
    const error = Array.isArray(errors) ? errors[0] : null

    return error?.info
        ?? error?.message
        ?? error?.description
        ?? dataresponse?.message
        ?? root?.message
        ?? response?.payload?.message
        ?? response?.message
        ?? fallback
}

const getWorkflowExecutionId = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const root = getResponseRoot(response)
    const errors = getErrors(response)
    const error = Array.isArray(errors) ? errors[0] : null

    return error?.execution_id
        ?? error?.executionId
        ?? dataresponse?.execution_id
        ?? dataresponse?.executionId
        ?? root?.execution_id
        ?? root?.executionId
        ?? response?.payload?.execution_id
        ?? response?.execution_id
        ?? ''
}

const formatWorkflowErrorMessage = (response: any, fallback: string, language?: Locale) => {
    const message = getWorkflowErrorMessage(response, fallback)
    const execution_id = getWorkflowExecutionId(response)

    if (!execution_id) return message

    const reference_label = language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

    return `${message} ${reference_label}: ${execution_id}`
}

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const root = getResponseRoot(response)
    const errors = getErrors(response)
    const failed = response?.success === false
        || response?.payload?.success === false
        || dataresponse?.success === false
        || root?.success === false
        || dataresponse?.code === 'failed'
        || root?.code === 'failed'

    if ((Array.isArray(errors) && errors.length > 0) || failed) {
        throw new Error(formatWorkflowErrorMessage(response, fallback, language))
    }
}

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(root?.input?.items)) return root.input.items
    if (Array.isArray(root?.input?.data)) return root.input.data

    return []
}

const normalizeResponsePage = (value: unknown, request_page_index: number) => {
    const response_page = toNumber(value, request_page_index + 1)

    return response_page <= 0 ? response_page + 1 : response_page
}

// Deliberately does not read token / refresh_token / signature_key from the raw item:
// these must never reach client state or the rendered UI.
const mapUserSessionItem = (item: any): UserSessionItem => ({
    id: toNumber(getField(item, ['id']), 0),
    user_id: String(getField(item, ['user_id', 'userId', 'userid']) ?? ''),
    login_name: String(getField(item, ['login_name', 'loginName', 'loginname']) ?? ''),
    ip_address: String(getField(item, ['ip_address', 'ipAddress', 'ipaddress']) ?? ''),
    expires_at: getField(item, ['expires_at', 'expiresAt', 'expiresat']) ?? null,
    is_revoked: toBoolean(getField(item, ['is_revoked', 'isRevoked', 'isrevoked'])),
    channel_id: String(getField(item, ['channel_id', 'channelId', 'channelid']) ?? ''),
    created_on_utc: getField(item, ['created_on_utc', 'createdOnUtc', 'createdonutc']) ?? null,
    updated_on_utc: getField(item, ['updated_on_utc', 'updatedOnUtc', 'updatedonutc']) ?? null,
    channel_roles: getField(item, ['channel_roles', 'channelRoles', 'channelroles']) ?? null,
    user_code: String(getField(item, ['user_code', 'userCode', 'usercode']) ?? ''),
    branch_code: String(getField(item, ['branch_code', 'branchCode', 'branchcode']) ?? ''),
    user_name: String(getField(item, ['user_name', 'userName', 'username']) ?? ''),
    device: getField(item, ['device']) ?? null
})

const mapSearchResponse = (response: any, request: UserSessionSearchRequest): UserSessionSearchResponse => {
    const root = getResponseRoot(response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(getField(root, ['total_pages', 'totalPages']), page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
        items: pickItems(root).map(mapUserSessionItem),
        total_count,
        total_pages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
        has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage'])),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size
    }
}

export const userSessionService = {
    getDefaultSearchResponse: (filter?: Partial<UserSessionSearchRequest>): UserSessionSearchResponse => ({
        items: [],
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false,
        page_index: normalizeResponsePage(filter?.page_index, DEFAULT_PAGE_INDEX),
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }),

    searchUserSessions: async ({ sessiontoken, language, filter }: SearchParams): Promise<UserSessionSearchResponse> => {
        if (!sessiontoken) {
            return userSessionService.getDefaultSearchResponse({
                page_index: Math.max(filter.page_index - 1, 0),
                page_size: filter.page_size
            })
        }

        const request: UserSessionSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            channel_code: 'BO'
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: WORKFLOWCODE.WF_BO_SEARCH_USER_SESSION,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load session activity.', language)

        return mapSearchResponse(response, request)
    }
}
