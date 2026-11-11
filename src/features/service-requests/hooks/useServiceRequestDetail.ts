'use client'

import type { Locale } from '@/configs/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import { useCallback, useEffect, useState } from 'react'

import { serviceRequestsText } from '../components/serviceRequestHelpers'
import { serviceRequestService } from '../services/serviceRequestService'
import type { ServiceRequestDetail, ServiceRequestsDictionary } from '../types'
import { ServiceRequestWorkflowError } from '../types'

const SERVICE_REQUEST_TYPE = 'SR'

type Params = {
    dictionary: ServiceRequestsDictionary
    sessiontoken?: string
    language: Locale
    requestCode: string
}

export const useServiceRequestDetail = ({ dictionary, sessiontoken, language, requestCode }: Params) => {
    const router = useRouter()
    const [request, setRequest] = useState<ServiceRequestDetail | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [wrongType, setWrongType] = useState(false)

    const loadDetail = useCallback(async () => {
        if (!requestCode.trim()) {
            setError(serviceRequestsText(dictionary, 'detail_not_found'))

            return
        }

        setLoading(true)
        setError(null)
        setWrongType(false)

        try {
            const response = await serviceRequestService.getServiceRequestByCode({ sessiontoken, language, requestCode })

            if (!response) {
                setRequest(null)
                setError(serviceRequestsText(dictionary, 'detail_not_found'))

                return
            }

            if (response.request_type !== SERVICE_REQUEST_TYPE) {
                setRequest(null)
                setWrongType(true)

                return
            }

            setRequest(response)
        } catch (caught) {
            if (caught instanceof ServiceRequestWorkflowError && caught.next_action === 'logout') {
                router.push(`/${language}/logout`)
            }

            setRequest(null)
            setError(caught instanceof Error ? caught.message : serviceRequestsText(dictionary, 'detail_load_failed'))
        } finally {
            setLoading(false)
        }
    }, [dictionary, language, requestCode, router, sessiontoken])

    useEffect(() => {
        void loadDetail()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestCode])

    const goBack = () => router.push(`/${language}/service-requests/service-requests`)

    const patchStatus = useCallback((nextStatus: string) => {
        setRequest(current => (current ? { ...current, status: nextStatus } : current))
    }, [])

    return {
        request,
        loading,
        error,
        wrongType,
        loadDetail,
        goBack,
        patchStatus
    }
}
