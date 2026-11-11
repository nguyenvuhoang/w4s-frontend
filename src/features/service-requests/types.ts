import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ServiceRequestsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ServiceRequestsPageProps = {
    dictionary: ServiceRequestsDictionary
    session: Session | null
    locale: Locale
}

export type ServiceRequestItem = {
    id: number
    project_id: number
    apartment_id: number
    service_request_category_id: number
    request_code: string
    project_code: string
    request_type: string
    apartment_code: string
    category_code: string
    title: string
    status: string
    priority: string
    scheduled_date: string | null
    completed_on_utc: string | null
    rating: number | null
}

export type ServiceRequestsFilter = {
    page_size: number
    page_index: number
    request_status: string
    search_text: string
    project_id: number
}

export type ServiceRequestsSearchRequest = ServiceRequestsFilter & {
    request_type: string
}

export type ServiceRequestsSearchResponse = {
    items: ServiceRequestItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}

export type ServiceRequestProjectOption = {
    id: number
    code: string
    name: string
}

export type ServiceRequestDetail = {
    id: number
    request_code: string
    project_id: number
    request_type: string
    resident_id: number | null
    user_code: string | null
    apartment_id: number | null
    service_request_category_id: number | null
    title: string
    content: string | null
    status: string
    priority: string
    handler_user_code: string | null
    supervisor_user_code: string | null
    internal_note: string | null
    cancel_reason: string | null
    is_hidden_from_resident: boolean
    is_visible_on_app: boolean
    scheduled_date: string | null
    completed_on_utc: string | null
    rating: number | null
    rating_comment: string | null
    attachments: ServiceRequestAttachment[]
    messages: ServiceRequestMessage[]
    status_logs: ServiceRequestStatusLog[]
}

export type ServiceRequestAttachment = {
    file_name: string
    file_url: string
    file_type: string
    is_result_attachment: boolean
}

export type ServiceRequestMessage = {
    sender_type: string
    content: string
    sent_on_utc: string | null
    attachments: ServiceRequestAttachment[]
}

export type ServiceRequestStatusLog = {
    from_status: string
    to_status: string
    changed_by_user_code: string | null
    note: string | null
    changed_on_utc: string | null
}

export type CreateServiceRequestForm = {
    attachments: string
    request_type: string
    apartment_id: string | number
    project_id: string | number
    title: string
    content: string
    service_request_category_id: string | number
}

export type CreateServiceRequestRequest = {
    attachments: string
    request_type: string
    apartment_id: number
    project_id: number
    title: string
    content: string
    service_request_category_id: number
}

export type UpdateServiceRequestStatusRequest = {
    internal_note: string
    request_code: string
    request_status: string
}

export type UpdateServiceRequestStatusResponse = {
    request_code: string
    status: string
}

export type AssignServiceRequestRequest = {
    handler_user_code: string
    supervisor_user_code: string
    request_code: string
}

export type AssignServiceRequestResponse = {
    request_code: string
    handler_user_code: string
    supervisor_user_code: string | null
    status: string
}

export type CancelServiceRequestRequest = {
    cancel_reason: string
    request_code: string
}

export type DeactivateServiceRequestRequest = {
    id: number
}

export type ServiceRequestActionForm = {
    request_status: string
    internal_note: string
    cancel_reason: string
}

export class ServiceRequestWorkflowError extends Error {
    next_action?: string
    error_code?: string

    constructor(message: string, next_action?: string, error_code?: string) {
        super(message)
        this.name = 'ServiceRequestWorkflowError'
        this.next_action = next_action
        this.error_code = error_code
    }
}
