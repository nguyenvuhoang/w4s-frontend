'use client'

import type { Locale } from '@/configs/i18n'
import { useCallback, useEffect, useState } from 'react'

import { chatText } from '../components/serviceRequestChatHelpers'
import {
    isServiceRequestMessagesGatewayNotReady,
    serviceRequestChatService
} from '../services/serviceRequestChatService'
import type { ChatDictionary, ServiceRequestMessage } from '../types'
import { ServiceRequestChatWorkflowError } from '../types'

type Params = {
    dictionary: ChatDictionary
    language: Locale
    serviceRequestId: number
    canSend?: boolean
}

export const useServiceRequestChat = ({ dictionary, language, serviceRequestId, canSend = false }: Params) => {
    const [messages, setMessages] = useState<ServiceRequestMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [unavailable, setUnavailable] = useState(false)
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)

    const resolveLoadError = useCallback((caught: unknown) => (
        caught instanceof Error && caught.message
            ? caught.message
            : chatText(dictionary, 'chat_not_ready')
    ), [dictionary])

    const loadMessages = useCallback(async () => {
        if (!serviceRequestId) return

        setLoading(true)
        setError(null)
        setUnavailable(false)

        try {
            // service_request_id is always passed here so we never fetch the unfiltered message list.
            const response = await serviceRequestChatService.searchMessages({
                language,
                serviceRequestId
            })

            setMessages(response.items)
        } catch (caught) {
            setMessages([])

            if (isServiceRequestMessagesGatewayNotReady(caught)) {
                setUnavailable(true)

                return
            }

            setError(resolveLoadError(caught))
        } finally {
            setLoading(false)
        }
    }, [language, resolveLoadError, serviceRequestId])

    useEffect(() => {
        void loadMessages()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceRequestId])

    const handleSend = async () => {
        const trimmed = draft.trim()

        if (!trimmed || sending || !canSend || !serviceRequestId) return

        setSending(true)
        setSendError(null)

        try {
            const created = await serviceRequestChatService.createMessage({
                language,
                serviceRequestId,
                content: trimmed
            })

            setDraft('')

            if (created) {
                setMessages(current => [...current, created])
            } else {
                await loadMessages()
            }
        } catch (caught) {
            if (isServiceRequestMessagesGatewayNotReady(caught)) {
                setUnavailable(true)
                setSendError(null)

                return
            }

            setSendError(
                caught instanceof ServiceRequestChatWorkflowError || caught instanceof Error
                    ? caught.message
                    : chatText(dictionary, 'send_failed')
            )
        } finally {
            setSending(false)
        }
    }

    return {
        messages,
        loading,
        error,
        unavailable,
        draft,
        setDraft,
        sending,
        sendError,
        loadMessages,
        handleSend
    }
}
