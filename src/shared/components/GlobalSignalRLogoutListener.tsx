'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';

import { useSignalRConnection } from '@/@core/hooks/useSignalRVerification';
import { env } from '@/env.mjs';
import { getLocalizedUrl } from '@utils/i18n';
import type { Locale } from '@/configs/i18n';

const FORCE_LOGOUT_KEY = 'force_logout_required';

type Props = {
    dictionary?: any;
    locale?: string;
};

const GlobalSignalRLogoutListener = ({ dictionary, locale }: Props) => {
    const hubUrl = env.NEXT_PUBLIC_SIGNALR ?? 'https://emicms.jits.com.vn:2611/signal';
    const { data: session, update } = useSession();
    const token = session?.user?.token as string | undefined;

    const { connection, isReady } = useSignalRConnection(hubUrl, token);
    const router = useRouter();

    // Khi load láº¡i trang, náº¿u trÆ°á»›c Ä‘Ã³ Ä‘Ã£ force logout thÃ¬ Ä‘Ã¡ ra logout luÃ´n
    useEffect(() => {
        const forceLogout = localStorage.getItem(FORCE_LOGOUT_KEY);
        if (forceLogout) {
            console.log('Force logout detected from previous session');
            localStorage.removeItem(FORCE_LOGOUT_KEY);
            router.push('/logout');
        }
    }, [router]);

    // ÄÄƒng kÃ½ handler SignalR
    useEffect(() => {
        console.log('============Setting up GlobalSignalRLogoutListener effect=============');
        console.log('SignalR connection:', connection ? 'Available' : 'Not available');
        console.log('SignalR isReady (Init called):', isReady);

        if (!connection) return;

        const initHandler = (data: any) => {
            console.log('SignalR: Received init callback from server:', data);
        };

        const userLogOutHandler = async (data: any) => {
            console.log('========== Received UserLogOut event from SignalR ==========');
            console.log('Raw data:', JSON.stringify(data, null, 2));

            localStorage.setItem(FORCE_LOGOUT_KEY, 'true');

            const dictAuth = dictionary['auth'] ?? {};
            const dictCommon = dictionary['common'] ?? {};

            await Swal.fire({
                title: dictAuth.logoutrequiredtitle ?? 'Your session was terminated',
                html: `
                <div style="text-align:left">
                    <p>${dictAuth.logoutrequiredmessage ??
                            'You have request logout system. Maybe you have been reset password'
                            }</p>
                </div>
                `,
                icon: 'warning',
                allowOutsideClick: false,
                showCancelButton: false,
                confirmButtonText: dictCommon.logout ?? 'Logout now',
                iconHtml:
                    '<img src="/images/icon/warning.svg" alt="custom-icon" style="width:64px; height:64px;">',
                customClass: {
                    icon: 'no-border'
                }
            });

            localStorage.removeItem(FORCE_LOGOUT_KEY);

            if (session?.user) {
                await update({
                    user: {
                        ...session.user,
                        is_first_login: true
                    }
                });
            }

            router.push(getLocalizedUrl('/logout', (locale as Locale) || 'en'));
        };

        console.log('SignalR: Registering handlers...');
        connection.on('init', initHandler);
        connection.on('UserLogOut', userLogOutHandler);
        console.log('SignalR: All handlers registered successfully - waiting for events...');

        return () => {
            console.log('SignalR: Removing handlers');
            connection.off('init', initHandler);
            connection.off('UserLogOut', userLogOutHandler);
        };
    }, [connection, isReady, router, dictionary, locale, session, update]);

    return null;
};

export default GlobalSignalRLogoutListener;

