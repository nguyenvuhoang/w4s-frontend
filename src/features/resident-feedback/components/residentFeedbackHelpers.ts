import type { ChipProps } from '@mui/material/Chip'

import type { ResidentFeedbackDictionary, ResidentFeedbackFilter, ResidentFeedbackMessage } from '../types'

export const emptyResidentFeedbackFilter: ResidentFeedbackFilter = {
    page_size: 10,
    page_index: 0,
    request_status: '',
    search_text: '',
    project_id: 0
}

export const residentFeedbackText = (dictionary: ResidentFeedbackDictionary, key: string) => (
    dictionary.resident_feedback?.[key] ?? key
)

export const commonText = (dictionary: ResidentFeedbackDictionary, key: string) => (
    dictionary.common?.[key] ?? key
)

export const requestStatusOptions = ['', 'SUBMITTED', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const formatResidentFeedbackDate = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(date)
}

export const formatResidentFeedbackDateTime = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date)
}

export const getResidentFeedbackMessages = (value: unknown): ResidentFeedbackMessage[] => {
    const container = value && typeof value === 'object' ? value as Record<string, unknown> : null
    const messages = Array.isArray(value) ? value : Array.isArray(container?.items) ? container.items : []

    return messages.flatMap(message => {
        if (!message || typeof message !== 'object') return []

        const item = message as Record<string, unknown>
        const content = typeof item.content === 'string' ? item.content : ''
        const sender_type = typeof item.sender_type === 'string' ? item.sender_type : ''
        const sent_on_utc = typeof item.sent_on_utc === 'string' ? item.sent_on_utc : null

        return [{ content, sender_type, sent_on_utc }]
    }).sort((left, right) => {
        const leftTime = left.sent_on_utc ? new Date(left.sent_on_utc).getTime() : 0
        const rightTime = right.sent_on_utc ? new Date(right.sent_on_utc).getTime() : 0

        return leftTime - rightTime
    })
}

export const getResidentFeedbackMessagesSummary = (value: unknown) => {
    const container = value && typeof value === 'object' ? value as Record<string, unknown> : null
    const messages = getResidentFeedbackMessages(value)

    if (messages.length === 0) return null

    const content = messages[messages.length - 1].content

    const count = Number(container?.total_count ?? container?.count)

    return { count: Number.isFinite(count) && count >= messages.length ? count : messages.length, content }
}

export const getFeedbackStatusLabel = (dictionary: ResidentFeedbackDictionary, status: string) => {
    const keys: Record<string, string> = {
        SUBMITTED: 'submitted',
        'IN PROGRESS': 'in_progress',
        IN_PROGRESS: 'in_progress',
        IN_PROCESS: 'in_progress',
        PROCESSED: 'processed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        D: 'deactivated'
    }

    return keys[status] ? residentFeedbackText(dictionary, keys[status]) : status || '-'
}

export const getFeedbackStatusColor = (status: string): ChipProps['color'] => {
    if (status === 'COMPLETED') return 'success'
    if (status === 'PROCESSED') return 'success'
    if (status === 'IN PROGRESS' || status === 'IN_PROGRESS' || status === 'IN_PROCESS') return 'info'
    if (status === 'CANCELLED') return 'default'
    if (status === 'D') return 'default'
    if (status === 'SUBMITTED') return 'warning'

    return 'default'
}

export const getFeedbackPriorityLabel = (dictionary: ResidentFeedbackDictionary, priority: string) => {
    const keys: Record<string, string> = {
        LOW: 'low',
        NORMAL: 'normal',
        HIGH: 'high',
        URGENT: 'urgent'
    }

    return keys[priority] ? residentFeedbackText(dictionary, keys[priority]) : priority || '-'
}

export const getFeedbackPriorityColor = (priority: string): ChipProps['color'] => {
    if (priority === 'URGENT') return 'error'
    if (priority === 'HIGH') return 'warning'
    if (priority === 'LOW') return 'default'

    return 'info'
}

export const getFeedbackRequestTypeLabel = (dictionary: ResidentFeedbackDictionary, type: string) => {
    if (type === 'FB') return residentFeedbackText(dictionary, 'feedback')
    if (type === 'SR') return residentFeedbackText(dictionary, 'service_request')

    return type || '-'
}

export const displayResidentFeedbackText = (value?: string | number | null) => (
    value === null || value === undefined || value === '' ? '-' : String(value)
)

export const getProjectStatusLabel = (dictionary: ResidentFeedbackDictionary, status: string) => {
    if (status === 'A') return residentFeedbackText(dictionary, 'status_active')
    if (status === 'I') return residentFeedbackText(dictionary, 'status_inactive')
    if (status === 'B') return residentFeedbackText(dictionary, 'status_blocked')
    if (status === 'DRAFT') return residentFeedbackText(dictionary, 'status_draft')

    return status || '-'
}

export const getProjectStatusColor = (status: string): ChipProps['color'] => {
    if (status === 'A') return 'success'
    if (status === 'I') return 'default'
    if (status === 'B') return 'error'
    if (status === 'DRAFT') return 'warning'

    return 'info'
}

