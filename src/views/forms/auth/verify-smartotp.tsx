/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useImageVariant } from '@/@core/hooks/useImageVariant'
import { useSignalRVerification } from '@/@core/hooks/useSignalRVerification'
import { authenticate } from '@/actions'
import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { getDictionary } from '@/utils/getDictionary'
import { getLocalizedUrl } from '@/utils/i18n'
import LoginFooter from '@/views/forms/auth/login-footer'
import type { Mode } from '@core/types'
import { NoSsr, Typography } from '@mui/material'
import { Session } from 'next-auth'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

const VerificationScreen = ({ mode, dictionary, locale, session }: {
    mode: Mode,
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    locale: Locale
    session: Session | null
}) => {

    /**
     * Vars Image
     */
    const darkImg = '/images/pages/login-night.jpg'
    const lightImg = '/images/pages/login-day.jpg'
    const authBackground = useImageVariant(mode, lightImg, darkImg)

    const darklogo = '/images/pages/logo-night.svg'
    const lightlogo = '/images/pages/logo.svg'
    const logo = useImageVariant(mode, lightlogo, darklogo)


    const [timer, setTimer] = useState(90)
    const [tokenregister, setTokenRegister] = useState<string | null>(null)

    const { remainingTime, receivedArguments, realToken, verifyStatus } = useSignalRVerification(env.NEXT_PUBLIC_SIGNALR ?? 'http://192.168.1.138:2611/signal', session?.user?.token as string);

    //Hooks 
    const router = useRouter();

    useEffect(() => {
        if (remainingTime) {
            setTimer(remainingTime);
        }
    }, [remainingTime]);

    useEffect(() => {
        if (realToken) {
            const updateToken = async () => {
                const res = await authenticate(undefined, undefined, undefined, undefined, realToken);
                if (res?.error === '') {
                    router.push(getLocalizedUrl(`/`, locale as Locale));
                } else {
                    Swal.fire({
                        position: 'center',
                        icon: 'error',
                        color: 'error',
                        allowOutsideClick: false,
                        text: dictionary['common'].servererror,
                        showCancelButton: false,
                        iconHtml: '<img src="/images/icon/error.svg" alt="custom-icon" style="width:64px; height:64px;">',
                        customClass: {
                            icon: 'no-border'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) {
                            router.push('/logout');

                        }
                    });
                }

            };

            updateToken();
        }
    }, [realToken]);

    useEffect(() => {
        if (receivedArguments) {
            setTokenRegister(receivedArguments);
        }
    }, [receivedArguments]);


    useEffect(() => {
        const handleRefresh = () => {
            sessionStorage.setItem('isRefreshed', 'true');
        };

        const handleLogoutOnRefresh = () => {
            if (sessionStorage.getItem('isRefreshed') === 'true') {
                sessionStorage.removeItem('isRefreshed');
                router.push('/logout');
            }
        };

        // Set the flag on mount and remove it on unmount
        window.addEventListener('beforeunload', handleRefresh);
        handleLogoutOnRefresh();

        return () => {
            sessionStorage.removeItem('isRefreshed');
            window.removeEventListener('beforeunload', handleRefresh);
        };
    }, [router]);

    useEffect(() => {
        if (timer === 1) {
            Swal.fire({
                position: 'center',
                icon: 'error',
                color: 'error',
                allowOutsideClick: false,
                text: dictionary['auth'].authentokentimeout,
                showCancelButton: false,
                iconHtml: '<img src="/images/icon/error.svg" alt="custom-icon" style="width:64px; height:64px;">',
                customClass: {
                    icon: 'no-border'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/logout');
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timer]);

    useEffect(() => {
        if (!verifyStatus) {
            Swal.fire({
                position: 'center',
                icon: 'error',
                color: 'error',
                allowOutsideClick: false,
                text: dictionary['auth'].rejectlogin,
                showCancelButton: false,
                iconHtml: '<img src="/images/icon/error.svg" alt="custom-icon" style="width:64px; height:64px;">',
                customClass: {
                    icon: 'no-border'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/logout');
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verifyStatus]);

    return (
        <>
            <NoSsr />
            <div
                className='fixed top-0 left-0 w-full h-full'
                style={{ backgroundImage: `url(${authBackground})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}
            >
                <div className="relative w-full h-full overflow-auto">
                    <div className="elipse"></div>
                    <div className="grid p-6 gap-14 grid-rows-[auto,1fr,auto] sm:p-10">
                        {/* Header */}
                        <div className="header">
                            <div className="logo">
                                <Image src={logo} className='sm:h-[67px] h-[40px]' width={195} height={67} alt='Logo'></Image>
                            </div>
                        </div>
                        {/* Content */}

                        <div className="body-content body-content-width-small">
                            <div className="flex flex-col items-center space-y-6 p-4 shadow-md rounded-xl">
                                {/* Info message with icon */}
                                <div className="flex items-center p-4 bg-green-100 rounded-lg shadow-sm">
                                    <i className="ri-information-line text-green-600 mr-2 text-lg"></i>
                                    <Typography variant="body1" className="text-gray-800">
                                        {dictionary['auth'].pleaseaccesssmartotplogin}
                                    </Typography>
                                </div>
                                {tokenregister && (
                                    <div className="flex items-center p-4 bg-green-100 rounded-lg shadow-sm">
                                        <i className="ri-information-line text-green-600 mr-2 text-lg"></i>
                                        <Typography variant="body1" className="text-gray-800">
                                            {dictionary['auth'].registertoken} {tokenregister}
                                        </Typography>
                                    </div>
                                )}
                                {/* Countdown timer */}
                                <div className="flex items-center justify-center h-14 w-64 bg-gray-200 rounded-xl text-heading-4 text-gray-700">
                                    <i className="ri-time-line text-[#066a4c] mr-2 spin"></i>
                                    <Typography variant="body2" sx={{ color: '#066a4c', fontSize: '14px' }}>
                                        {dictionary['common'].pleasewait} {tokenregister ? dictionary['common'].more : ''}  {timer} s
                                    </Typography>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <LoginFooter
                            dictionary={dictionary}
                            locale={locale}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default VerificationScreen
