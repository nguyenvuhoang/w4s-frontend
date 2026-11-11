import 'server-only'

import logger from '@lib/logger'
import { env } from '@/env.mjs'
import { i18n } from '@/configs/i18n'
import type { Locale } from '@/configs/i18n'

// Confirmed workflow — already available on backend.
export const SERVICE_REQUEST_MESSAGES_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_SERVICE_REQUEST_MESSAGES'

// TODO: WF_BO_CREATE_SERVICE_REQUEST_MESSAGE is the agreed contract but is NOT confirmed live on
// the backend yet. Keep SERVICE_REQUEST_MESSAGE_CREATE_API_READY = false until backend confirms
// this workflow exists, otherwise the send form must stay disabled (never fake a successful send).
export const SERVICE_REQUEST_MESSAGE_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_SERVICE_REQUEST_MESSAGE'
export const SERVICE_REQUEST_MESSAGE_CREATE_API_READY = true

// Minimal shape the UI actually renders (MessageBubble in ServiceRequestChatPanel.tsx). Internal
// fields such as is_internal / sender_user_code are consumed server-side only and never leave
// this module — the resident-facing panel must never receive internal notes or staff user codes.
export type ServiceRequestMessageDTO = {
    id: number
    sender_type: 'RESIDENT' | 'ADMIN'
    content: string
    sent_on_utc: string | null
}

export type ServiceRequestMessagesResponseDTO = {
    items: ServiceRequestMessageDTO[]
    total_count: number
    page_index: number
    page_size: number
    has_next_page: boolean
}

export class ServiceRequestMessagesGatewayError extends Error {
    status: number
    next_action?: string
    error_code?: string

    constructor(message: string, status: number, next_action?: string, error_code?: string) {
        super(message)
        this.name = 'ServiceRequestMessagesGatewayError'
        this.status = status
        this.next_action = next_action
        this.error_code = error_code
    }
}

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
    const dataresponse = response?.dataresponse
    const data = dataresponse?.data ?? response?.data ?? response

    return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(root?.input?.items)) return root.input.items

    return []
}

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: unknown) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const assertWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = response?.dataresponse
    const data = dataresponse?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.errors ?? []
    const firstError = Array.isArray(errors) ? errors[0] : undefined
    const failed = dataresponse?.success === false || data?.success === false
        || dataresponse?.code === 'failed' || data?.code === 'failed'

    if (firstError || failed) {
        const nextAction = firstError?.next_action ?? dataresponse?.next_action
        const status = nextAction === 'logout' ? 401 : 502

        throw new ServiceRequestMessagesGatewayError(
            firstError?.info ?? firstError?.message ?? firstError?.description ?? dataresponse?.message ?? fallback,
            status,
            nextAction,
            firstError?.code
        )
    }
}

// Internal, full-fidelity shape used only inside this module (before is_internal filtering /
// DTO trimming). Never returned from an exported function.
type RawServiceRequestMessage = {
    id: number
    sender_type: 'RESIDENT' | 'ADMIN'
    content: string
    is_internal: boolean
    sent_on_utc: string | null
}

const mapRawMessage = (item: any): RawServiceRequestMessage => {
    const senderType = String(getField(item, ['sender_type']) ?? '').toUpperCase()

    return {
        id: toNumber(getField(item, ['id'])),
        sender_type: senderType === 'RESIDENT' ? 'RESIDENT' : 'ADMIN',
        content: String(getField(item, ['content']) ?? ''),
        is_internal: toBoolean(getField(item, ['is_internal'])),
        sent_on_utc: getField(item, ['sent_on_utc']) ?? null
    }
}

const toDTO = ({ is_internal, ...rest }: RawServiceRequestMessage): ServiceRequestMessageDTO => rest

/**
 * Calls the workflow gateway from the server. This function must never be imported by
 * client components — the `server-only` import above makes any accidental client import
 * fail the build.
 */
const callWorkflow = async (workflowid: string, fields: Record<string, unknown>, uid: string, language?: Locale) => {
    const endpoint = env.REST_API_ENDPOINT

    if (!endpoint) {
        logger.error('❌ Service request messages gateway: REST_API_ENDPOINT is not configured.')
        throw new ServiceRequestMessagesGatewayError('Backend endpoint is not configured.', 500)
    }

    let response: Response

    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                lang: language || i18n.defaultLocale,
                app: process.env.NEXT_PUBLIC_APPLICATION_CODE || 'BO',
                uid
            },
            body: JSON.stringify({ workflowid, fields }),
            cache: 'no-store',
            signal: AbortSignal.timeout(15000)
        })
    } catch (error: any) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
            throw new ServiceRequestMessagesGatewayError('Backend timeout while loading service request messages.', 504)
        }

        // Log the failure shape only — never the uid/token or message content.
        logger.error('❌ Service request messages gateway request failed:', error?.name ?? error)
        throw new ServiceRequestMessagesGatewayError('Bad gateway: unable to reach backend service.', 502)
    }

    if (!response.ok) {
        // Any non-2xx HTTP-level response from the backend gateway is a gateway failure from the
        // BFF's perspective, not something the client caused — surface it as 502 rather than
        // forwarding the raw backend status code.
        logger.error(`❌ Service request messages gateway responded with HTTP ${response.status}`)
        throw new ServiceRequestMessagesGatewayError('Bad gateway: backend service returned an error.', 502)
    }

    const dataresponse = await response.json()

    if (dataresponse?.errors?.[0]?.next_action === 'logout') {
        throw new ServiceRequestMessagesGatewayError('Session expired or unauthorized. Please login again.', 401, 'logout')
    }

    return { dataresponse }
}

export const searchServiceRequestMessages = async ({
    uid,
    language,
    serviceRequestId,
    pageIndex,
    pageSize
}: {
    uid: string
    language?: Locale
    serviceRequestId: number
    pageIndex: number
    pageSize: number
}): Promise<ServiceRequestMessagesResponseDTO> => {
    const response = await callWorkflow(
        SERVICE_REQUEST_MESSAGES_SEARCH_WORKFLOW_ID,
        {
            page_size: pageSize,
            page_index: pageIndex,
            search_text: '',
            service_request_id: serviceRequestId
        },
        uid,
        language
    )

    assertWorkflowSuccess(response, 'Unable to load service request messages.')

    const root = pickDataRoot(response)

    // The resident-facing panel must never see internal (staff-only) notes — filter them out here,
    // server-side, instead of relying on the client to hide them.
    const items = pickItems(root)
        .map(mapRawMessage)
        .filter(message => !message.is_internal && message.content.trim().length > 0)
        .map(toDTO)

    const totalCount = toNumber(getField(root, ['total_count', 'total_items']), items.length)
    const resolvedPageSize = toNumber(getField(root, ['page_size']), pageSize)
    const resolvedPageIndex = toNumber(getField(root, ['page_index']), pageIndex)

    return {
        items,
        total_count: totalCount,
        page_index: resolvedPageIndex,
        page_size: resolvedPageSize,
        has_next_page: resolvedPageSize > 0 && (resolvedPageIndex + 1) * resolvedPageSize < totalCount
    }
}

export const createServiceRequestMessage = async ({
    uid,
    language,
    serviceRequestId,
    content
}: {
    uid: string
    language?: Locale
    serviceRequestId: number
    content: string
}): Promise<ServiceRequestMessageDTO | null> => {
    if (!SERVICE_REQUEST_MESSAGE_CREATE_API_READY) {
        throw new ServiceRequestMessagesGatewayError('The send-message API is not available yet.', 501)
    }

    const response = await callWorkflow(
        SERVICE_REQUEST_MESSAGE_CREATE_WORKFLOW_ID,
        {
            service_request_id: serviceRequestId,
            content,
            is_internal: false
        },
        uid,
        language
    )

    assertWorkflowSuccess(response, 'Unable to send message.')

    const root = pickDataRoot(response)

    if (!root || typeof root !== 'object' || Array.isArray(root)) return null

    const mapped = mapRawMessage(root)

    return mapped.id > 0 ? toDTO(mapped) : null
}
