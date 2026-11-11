import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ResidentFeedbackDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ResidentFeedbackPageProps = {
    dictionary: ResidentFeedbackDictionary
    session: Session | null
    locale: Locale
}

export type ResidentFeedbackItem = {
    id: number
    request_code: string
    apartment_code: string
    resident: string | null
    category_code: string
    content: string | null
    note: string | null
    assignment: string | null
    status: string
    created_on_utc: string | null
    requests_message: unknown
}

export type ResidentFeedbackMessage = {
    content: string
    sender_type: 'ADMIN' | 'RESIDENT' | string
    sent_on_utc: string | null
}

export type ResidentFeedbackAttachment = {
    file_name: string
    file_url: string
    file_type: string
    is_result_attachment: boolean
}

export type ResidentFeedbackStatusLog = {
    status: string
    note: string | null
    created_by: string | null
    created_on_utc: string | null
}

export type ResidentFeedbackDetail = {
    request_code: string
    project_code: string
    apartment_code: string
    resident_code: string
    request_type: string
    category_code: string
    title: string
    content: string | null
    status: string
    priority: string
    scheduled_date: string | null
    completed_on_utc: string | null
    cancel_reason: string | null
    rating: number | null
    rating_comment: string | null
    attachments: ResidentFeedbackAttachment[]
    messages: ResidentFeedbackMessage[]
    status_logs: ResidentFeedbackStatusLog[]
}

export type ResidentFeedbackFilter = {
    page_size: number
    page_index: number
    request_status: string
    search_text: string
    project_id: number
}

export type ResidentFeedbackSearchRequest = ResidentFeedbackFilter & {
    request_type: string
}

export type ResidentFeedbackSearchResponse = {
    items: ResidentFeedbackItem[]
    total_count: number
    total_pages: number
    has_previous_page: boolean
    has_next_page: boolean
    page_index: number
    page_size: number
}

export type ResidentFeedbackProjectOption = {
    id: number
    code: string
    name: string
    status: string
    address: string
}

export class ResidentFeedbackWorkflowError extends Error {
    next_action?: string
    error_code?: string
    execution_id?: string

    constructor(message: string, next_action?: string, error_code?: string, execution_id?: string) {
        super(message)
        this.name = 'ResidentFeedbackWorkflowError'
        this.next_action = next_action
        this.error_code = error_code
        this.execution_id = execution_id
    }
}
