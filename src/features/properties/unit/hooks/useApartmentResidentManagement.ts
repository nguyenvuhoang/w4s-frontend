import { useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import type { ApartmentResidentManagementResult } from '../../types'
import { apartmentResidentService } from '../services/apartmentResidentService'

const empty_result: ApartmentResidentManagementResult = { apartment: null, residents: [] }

export function useApartmentResidentManagement({
    sessiontoken,
    language,
    apartmentId,
    loadErrorMessage
}: {
    sessiontoken?: string
    language?: Locale
    apartmentId: number | null
    loadErrorMessage: string
}) {
    const [data, setData] = useState<ApartmentResidentManagementResult>(empty_result)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        if (!apartmentId) {
            setData(empty_result)

            return
        }

        setLoading(true)
        setError(null)
        try {
            setData(await apartmentResidentService.getResidentsByApartmentId({ sessiontoken, language, apartment_id: apartmentId }))
        } catch (err) {
            setError(err instanceof Error ? err.message : loadErrorMessage)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apartmentId, sessiontoken])

    return { data, loading, error, reload: loadData }
}
