// src/app/[locale]/(dashboard)/(portal)/layout.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Skeleton } from '@mui/material'
import Providers from '@/components/Providers'
import VerticalLayout from '@/@layouts/VerticalLayout'
import HorizontalLayout from '@/@layouts/HorizontalLayout'
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import Navigation from '@/components/layout/vertical/Navigation'
import Navbar from '@/@layouts/components/vertical/Navbar'
import HeaderHorizontal from '@components/layout/horizontal/Header'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import Spinner from '@/components/spinners'
import AuthGuard from '@/hocs/AuthGuard'
import IdleTimer from '@/hocs/IdleTimer'
import ErrorPage from '@/views/Error'
import ChangePassword from '@/views/ChangePassword'
import GlobalSignalRLogoutListener from '@/components/GlobalSignalRLogoutListener'

import { auth } from '@/auth'
import { formService, systemServiceApi } from '@/servers/system-service'
import { i18n } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import { AUTHENTICATION_ERROR_STATUS, BAD_REQUEST } from '@/servers/lib/http'
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'
import { unstable_cache as cache } from 'next/cache'
import { InitUserStore } from '@/@core/stores/InitUserStore'
import { getLocalizedUrl } from '@/utils/i18n'

const getDictionaryCached = cache(
    async (locale: Locale) => getDictionary(locale),
    ['dictionary-by-locale'],
    { revalidate: 3600 }
)

type Params = Promise<{ locale: Locale }>

export default function Layout({ children, params }: ChildrenType & { params: Params }) {
    return (
        <Suspense fallback={<Skeleton />} >
            <PortalLayoutContent params={params}>{children}</PortalLayoutContent>
        </Suspense>
    )
}
export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}
async function PortalLayoutContent({
    children,
    params
}: ChildrenType & { params: Params }) {
    const { locale } = await params

    const session = await auth()
    if (!session || !session.user || session.user.token?.length === 0) {
        console.log('[Portal Layout] No session found, redirecting to logout')
        redirect(getLocalizedUrl('/logout', locale))
    }

    console.log('[Portal Layout] Session found, token exists:', !!session.user.token)

    const systemData = await formService.getSystemInfo({
        sessiontoken: session.user.token as string,
        language: locale
    })
    console.log('[Portal Layout] :', {
        status: systemData.status,
        hasError: systemData?.payload?.dataresponse?.errors?.length > 0,
        errorCodes: systemData?.payload?.dataresponse?.errors?.map((err: any) => err.key) || [],
        requireLogout: systemData?.payload?.requireLogout
    })

    // Check for 401 status or requireLogout flag first (before accessing dataresponse)
    if (systemData.status === 401 || systemData?.payload?.requireLogout) {
        console.log('[Portal Layout] 401 or requireLogout detected, redirecting to logout')
        redirect(getLocalizedUrl('/logout', locale))
    }

    if (systemData.status !== 200) {
        console.log('[Portal Layout] Non-200 status, showing spinner')
        return <Spinner />
    }

    // Now safe to check dataresponse.errors since we already handled 401
    if (systemData?.payload?.dataresponse?.errors?.some(
        (err: any) => parseInt(err.key) === AUTHENTICATION_ERROR_STATUS || parseInt(err.key) === BAD_REQUEST
    )) {
        console.log('[Portal Layout] Authentication/Bad Request error in response, redirecting to logout')
        redirect(getLocalizedUrl('/logout', locale))
    }

    const datapayload = systemData.payload.dataresponse

    if (!isValidResponse(systemData) || (datapayload.errors && datapayload.errors.length > 0)) {
        const e = datapayload.errors?.[0]
        const errorString = e ? `ExecutionID:${e.execute_id} - ${e.info}` : 'Unknown server error'
        console.log('[Portal Layout] Invalid response or error:', errorString)
        return <ErrorPage error={errorString} side="server" />
    }

    const datainput = datapayload?.data
    const usercommand = datainput?.user_command
    const avatar = datainput?.avatar ?? ''
    const name = datainput?.name ?? ''
    const role = datainput?.role ?? ''
    const isfirstlogin = session.user.is_first_login ?? datainput?.is_first_login ?? false
    const dictionary = await getDictionaryCached(locale)
    const login_name = datainput?.login_name ?? ''

    // If this is the first login, show the change password screen
    if (isfirstlogin) {
        return (
            <Providers initialAvatar={avatar}>
                <ChangePassword dictionary={dictionary} session={session} loginname={login_name} />
            </Providers>
        )
    }

    return (
        <Providers initialAvatar={avatar}>
            <AuthGuard locale={locale}>
                <IdleTimer locale={locale}>
                    {/* Global SignalR listener for remote logout */}
                    <GlobalSignalRLogoutListener dictionary={dictionary} locale={locale} />

                    <LayoutWrapper
                        verticalLayout={
                            <VerticalLayout
                                navigation={<Navigation dictionary={dictionary} menudata={usercommand} />}
                                navbar={<Navbar><></></Navbar>}
                                footer={<></>}
                            >
                                {children}
                            </VerticalLayout>
                        }
                        horizontalLayout={
                            <HorizontalLayout
                                header={<HeaderHorizontal menu={usercommand} avatar={avatar} name={name} dictionary={dictionary} />}
                                footer={<HorizontalFooter />}
                            >
                                <InitUserStore name={name} avatar={avatar} role={role} />
                                {children}
                            </HorizontalLayout>
                        }
                    />
                </IdleTimer>
            </AuthGuard>
        </Providers>
    )
}
