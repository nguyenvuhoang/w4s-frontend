import type { ChatDictionary, ServiceRequestMessageSenderType } from '../types'

export const chatText = (dictionary: ChatDictionary, key: string) => (
    dictionary.service_request_chat?.[key] ?? key
)

export const commonText = (dictionary: ChatDictionary, key: string) => (
    dictionary.common?.[key] ?? key
)

export const getSenderLabel = (dictionary: ChatDictionary, senderType: ServiceRequestMessageSenderType) => (
    senderType === 'RESIDENT' ? chatText(dictionary, 'sender_resident') : chatText(dictionary, 'sender_admin')
)

export const getInternalLabel = (dictionary: ChatDictionary, isInternal: boolean) => (
    isInternal ? chatText(dictionary, 'internal_label') : chatText(dictionary, 'public_label')
)

export const formatChatTime = (value: string | null, locale: string) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date)
}
