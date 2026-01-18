// hooks/useLoginHandler.ts
'use client'

import type { Locale } from '@/configs/i18n'
import { handleLogin } from '@features/auth/services/login'
import { encrypt } from '@/utils/O9Extension'
import { getDictionary } from '@/utils/getDictionary'
import { getLocalizedUrl } from '@/utils/i18n'
import type { ErrorType, FormData } from '@core/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Swal from 'sweetalert2'

export const useLoginHandler = ({
    locale,
    dictionary
}: {
    locale: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
    const [errorState, setErrorState] = useState<ErrorType | null>(null)
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const onSubmit = async (data: FormData) => {
        setLoading(true)

        const honeypot = (document.querySelector('input[name="honeypot"]') as HTMLInputElement)?.value
        if (honeypot) {
            setLoading(false)
            return
        }

        const encryptedPassword = encrypt(`${data.username}_${data.password}`)
        const result = await handleLogin({ ...data, password: encryptedPassword }, locale, dictionary)

        if (result.verifyDevice) {
            await Swal.fire({
                position: 'center',
                icon: 'error',
                color: 'error',
                allowOutsideClick: false,
                text: result.errorState?.message?.[0],
                showCancelButton: false,
                iconHtml: '<img src="/images/icon/warning.svg" alt="custom-icon" style="width:64px; height:64px;">',
                customClass: { icon: 'no-border' }
            })

            sessionStorage.setItem('allowVerifyDevice', '1')
            sessionStorage.setItem('verifyUsername', result.verifyDevice.username)
            sessionStorage.setItem('verifyDeviceId', result.verifyDevice.deviceId)
            router.replace(getLocalizedUrl(`/verify-device`, locale as Locale))

            setLoading(false)
            return
        }

        if (result.redirectUrl) {
            router.replace(result.redirectUrl)
            return
        }

        if (result.errorState) {
            setErrorState(result.errorState)
        }

        setLoading(false)
    }

    return {
        onSubmit,
        loading,
        errorState,
        setErrorState
    }
}
