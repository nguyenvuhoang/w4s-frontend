import type { getDictionary } from '@/shared/utils/getDictionary'

export type ChatDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ServiceRequestMessageSenderType = 'RESIDENT' | 'ADMIN'

// Mirrors ServiceRequestMessageDTO in src/servers/service-requests/serviceRequestMessages.server.ts —
// this is the trimmed, UI-facing shape returned by /api/service-requests/{id}/messages. Internal
// fields (is_internal, sender_user_code, service_request_id) are filtered/dropped server-side and
// never sent to the browser.
export type ServiceRequestMessage = {
    id: number
    sender_type: ServiceRequestMessageSenderType
    content: string
    sent_on_utc: string | null
}

export type ServiceRequestMessagesResponse = {
    items: ServiceRequestMessage[]
    total_count: number
    page_index: number
    page_size: number
    has_next_page: boolean
}

export class ServiceRequestChatWorkflowError extends Error {
    next_action?: string
    error_code?: string

    constructor(message: string, next_action?: string, error_code?: string) {
        super(message)
        this.name = 'ServiceRequestChatWorkflowError'
        this.next_action = next_action
        this.error_code = error_code
    }
}
