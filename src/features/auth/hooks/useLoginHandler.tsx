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
    /**
         * HÃ m xÃ¡c thá»±c máº­t kháº©u ngÆ°á»i dÃ¹ng
            * @param username TÃªn Ä‘Äƒng nháº­p cá»§a ngÆ°á»i dÃ¹ng
            * @param password Máº­t kháº©u cá»§a ngÆ°á»i dÃ¹ng
            * @return Tráº£ vá» true náº¿u xÃ¡c thá»±c thÃ nh cÃ´ng, false náº¿u tháº¥t báº¡i
            * @description HÃ m nÃ y sáº½ mÃ£ hÃ³a máº­t kháº©u káº¿t há»£p vá»›i tÃªn Ä‘Äƒng nháº­p, sau Ä‘Ã³ gá»i hÃ m handleLogin Ä‘á»ƒ xÃ¡c thá»±c.
            * Náº¿u xÃ¡c thá»±c thÃ nh cÃ´ng, tráº£ vá» true, náº¿u cÃ³ lá»—i hoáº·c xÃ¡c thá»±c khÃ´ng thÃ nh cÃ´ng, tráº£ vá» false.
            */

    const verifyPassword = async (token: string, usercode: string, password: string): Promise<boolean> => {
        try {
            const encryptedPassword = encrypt(`${usercode}_${password}`)
            const response = await workflowService.runBODynamic({
                sessiontoken: token,
                txFo: {
                    bo: [
                        {
                            use_microservice: true,
                            input: {
                                workflowid: WORKFLOWCODE.GENERATE_CONTRACT_NUMBER,
                                learn_api: 'cbs_workflow_execute',
                                fields: {
                                    password: encryptedPassword,
                                    usercode: usercode
                                }
                            },
                        },
                    ],
                },
            });

            if (response.status === 200 && response.payload?.dataresponse) {
                return true;
            }

            return false;
        } catch (err) {
            console.error('Error verifying password:', err);
            return false;
        }
    }

    return {
        onSubmit,
        loading,
        errorState,
        setErrorState,
        verifyPassword
    }
}

