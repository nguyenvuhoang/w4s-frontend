import type { Locale } from '@/configs/i18n'

import type {
    ServiceRequestMessage,
    ServiceRequestMessagesResponse
} from '../types'
import { ServiceRequestChatWorkflowError } from '../types'

// Kept in sync with SERVICE_REQUEST_MESSAGE_CREATE_API_READY in
// src/servers/service-requests/serviceRequestMessages.server.ts — this copy only gates the UI
// (disables the composer); the server enforces the real guard regardless of what the client sends.
export const SERVICE_REQUEST_MESSAGE_CREATE_API_READY = true
export const SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE = 'MESSAGE_GATEWAY_NOT_READY'

const SERVICE_REQUEST_MESSAGES_GATEWAY_NOT_CONFIGURED_MESSAGES = [
    'Service request messages gateway: REST_API_ENDPOINT is not configured.',
    'REST_API_ENDPOINT is not configured',
    'Backend endpoint is not configured'
]

const buildMessagesUrl = (serviceRequestId: number) => `/api/service-requests/${serviceRequestId}/messages`

const parseErrorPayload = async (response: Response) => {
    const payload = await response.json().catch(() => null)

    return {
        message: payload?.message as string | undefined,
        next_action: payload?.next_action as string | undefined,
        error_code: payload?.error_code as string | undefined
    }
}

export const isServiceRequestMessagesGatewayNotReady = (caught: unknown) => {
    if (caught instanceof ServiceRequestChatWorkflowError) {
        return caught.error_code === SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE
            || SERVICE_REQUEST_MESSAGES_GATEWAY_NOT_CONFIGURED_MESSAGES.some(message => caught.message.includes(message))
    }

    return caught instanceof Error
        && SERVICE_REQUEST_MESSAGES_GATEWAY_NOT_CONFIGURED_MESSAGES.some(message => caught.message.includes(message))
}

export const serviceRequestChatService = {
    searchMessages: async ({
        language,
        serviceRequestId,
        pageIndex = 0,
        pageSize = 50
    }: {
        language?: Locale
        serviceRequestId: number
        pageIndex?: number
        pageSize?: number
    }): Promise<ServiceRequestMessagesResponse> => {
        if (!serviceRequestId) {
            return { items: [], total_count: 0, page_index: pageIndex, page_size: pageSize, has_next_page: false }
        }

        const params = new URLSearchParams({
            pageIndex: String(pageIndex),
            pageSize: String(pageSize)
        })

        if (language) params.set('lang', language)

        let response: Response

        try {
            response = await fetch(`${buildMessagesUrl(serviceRequestId)}?${params.toString()}`, {
                method: 'GET'
            })
        } catch (caught) {
            if (isServiceRequestMessagesGatewayNotReady(caught)) {
                throw new ServiceRequestChatWorkflowError(
                    'Message exchange is not available yet.',
                    undefined,
                    SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE
                )
            }

            throw caught
        }

        if (!response.ok) {
            const { message, next_action, error_code } = await parseErrorPayload(response)
            const resolvedCode = error_code
                ?? (message && SERVICE_REQUEST_MESSAGES_GATEWAY_NOT_CONFIGURED_MESSAGES.some(item => message.includes(item))
                    ? SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE
                    : undefined)

            throw new ServiceRequestChatWorkflowError(
                message ?? 'Unable to load service request messages.',
                next_action,
                resolvedCode
            )
        }

        return response.json() as Promise<ServiceRequestMessagesResponse>
    },

    createMessage: async ({
        language,
        serviceRequestId,
        content
    }: {
        language?: Locale
        serviceRequestId: number
        content: string
    }): Promise<ServiceRequestMessage | null> => {
        const params = new URLSearchParams()

        if (language) params.set('lang', language)

        let response: Response

        try {
            response = await fetch(`${buildMessagesUrl(serviceRequestId)}${params.toString() ? `?${params}` : ''}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ content })
            })
        } catch (caught) {
            if (isServiceRequestMessagesGatewayNotReady(caught)) {
                throw new ServiceRequestChatWorkflowError(
                    'Message exchange is not available yet.',
                    undefined,
                    SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE
                )
            }

            throw caught
        }

        if (!response.ok) {
            const { message, next_action, error_code } = await parseErrorPayload(response)
            const resolvedCode = error_code
                ?? (message && SERVICE_REQUEST_MESSAGES_GATEWAY_NOT_CONFIGURED_MESSAGES.some(item => message.includes(item))
                    ? SERVICE_REQUEST_MESSAGE_GATEWAY_NOT_READY_CODE
                    : undefined)

            throw new ServiceRequestChatWorkflowError(
                message ?? 'Unable to send message.',
                next_action,
                resolvedCode
            )
        }

        return response.json() as Promise<ServiceRequestMessage | null>
    }
}
