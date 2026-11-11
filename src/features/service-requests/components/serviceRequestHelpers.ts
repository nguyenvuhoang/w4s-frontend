import type { ServiceRequestsDictionary, ServiceRequestsFilter } from '../types'

export const emptyServiceRequestsFilter: ServiceRequestsFilter = {
    page_size: 10,
    page_index: 0,
    request_status: '',
    search_text: '',
    project_id: 1
}

export const serviceRequestsText = (dictionary: ServiceRequestsDictionary, key: string) => (
    dictionary.service_requests?.[key] ?? key
)

export const commonText = (dictionary: ServiceRequestsDictionary, key: string) => (
    dictionary.common?.[key] ?? key
)

export const requestStatusOptions = ['', 'SUBMITTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
export const requestTypeOptions = ['SR', 'FB'] as const

export const formatServiceRequestDate = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(date)
}

export const formatServiceRequestDateTime = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date)
}

export const getRequestStatusLabel = (dictionary: ServiceRequestsDictionary, status: string) => {
    const keys: Record<string, string> = {
        SUBMITTED: 'submitted',
        IN_PROGRESS: 'in_progress',
        IN_PROCESS: 'in_progress',
        PROCESSED: 'processed',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        D: 'deactivated'
    }

    return keys[status] ? serviceRequestsText(dictionary, keys[status]) : status || '-'
}

export const getRequestStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'success'
    if (status === 'PROCESSED') return 'success'
    if (status === 'IN_PROGRESS' || status === 'IN_PROCESS') return 'info'
    if (status === 'CANCELLED') return 'default'
    if (status === 'D') return 'default'
    if (status === 'SUBMITTED') return 'warning'

    return 'default'
}

export const getPriorityLabel = (dictionary: ServiceRequestsDictionary, priority: string) => {
    const keys: Record<string, string> = {
        LOW: 'low',
        NORMAL: 'normal',
        HIGH: 'high',
        URGENT: 'urgent'
    }

    return keys[priority] ? serviceRequestsText(dictionary, keys[priority]) : priority || '-'
}

export const getPriorityColor = (priority: string) => {
    if (priority === 'URGENT') return 'error'
    if (priority === 'HIGH') return 'warning'
    if (priority === 'LOW') return 'default'

    return 'info'
}

export const getRequestTypeLabel = (dictionary: ServiceRequestsDictionary, type: string) => {
    if (type === 'SR') return serviceRequestsText(dictionary, 'service_request')
    if (type === 'FB') return serviceRequestsText(dictionary, 'feedback')

    return type || '-'
}

export const getBooleanLabel = (dictionary: ServiceRequestsDictionary, value: boolean) => (
    value ? serviceRequestsText(dictionary, 'boolean_yes') : serviceRequestsText(dictionary, 'boolean_no')
)

export const displayText = (value?: string | number | null) => (
    value === null || value === undefined || value === '' ? '-' : String(value)
)
