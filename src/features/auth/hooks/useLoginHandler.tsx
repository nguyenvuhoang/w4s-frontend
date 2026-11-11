// hooks/useLoginHandler.ts
'use client'

import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
import { encrypt } from '@utils/O9Extension'
import { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import type { ErrorType, FormData } from '@core/types'
import { handleLogin } from '@features/auth/services/login'
import { useRouter } from '@shared/hooks/useRouter'
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

    const verifyPassword = async (sessionToken: string, usercode: string, password: string) => {
        if (!sessionToken || !usercode || !password) return false

        try {
            const encryptedPassword = encrypt(`${usercode}_${password}`)
            const response = await workflowService.runFODynamic({
                sessiontoken: sessionToken,
                workflowid: WORKFLOWCODE.BO_VERIFY_SENSITIVE_DATA,
                input: {
                    usercode,
                    password: encryptedPassword
                },
                language: locale as Locale
            })

            const errors = response.payload?.dataresponse?.errors

            if (response.status !== 200 || (Array.isArray(errors) && errors.length > 0)) {
                return false
            }

            return response.payload?.dataresponse?.data?.input?.data === true
        } catch {
            return false
        }
    }

    return {
        onSubmit,
        verifyPassword,
        loading,
        errorState,
        setErrorState
    }
}

