// src/app/[locale]/(dashboard)/(portal)/layout.tsx
import AuthGuard from '@/hocs/AuthGuard'
import IdleTimer from '@/hocs/IdleTimer'
import ErrorPage from '@/views/Error'
import GlobalSignalRLogoutListener from '@components/GlobalSignalRLogoutListener'
import Providers from '@components/Providers'
import Spinner from '@components/spinners'
import PageLoadingScreen from '@components/PageLoadingScreen'
import DashboardContent from '@/shared/components/layout/dashboard/DashboardContent'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { auth } from '@/auth'
import { AUTHENTICATION_ERROR_STATUS, BAD_REQUEST } from '@/servers/lib/http'
import { formService } from '@/servers/system-service'
import { handleApiError } from '@/shared/utils/handleApiError'
import type { Locale } from '@configs/i18n'
import { i18n } from '@configs/i18n'
import type { ChildrenType } from '@core/types'
import { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import { isValidResponse } from '@utils/isValidResponse'
import { unstable_cache as cache } from 'next/cache'
import ChangePassword from '../(auth-layout-pages)/change-password/components'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

const getDictionaryCached = cache(
    async (locale: Locale) => getDictionary(locale),
    ['dictionary-by-locale'],
    { revalidate: 3600 }
)

type Params = Promise<{ locale: Locale }>

export default function Layout({ children, params }: ChildrenType & { params: Params }) {
    return (
        <Suspense fallback={<PageLoadingScreen debugSource='(dashboard)/layout Suspense' />}>
            <PortalLayoutContent params={params}>{children}</PortalLayoutContent>
        </Suspense>
    )
}
export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}
async function PortalLayoutContent({ children, params }: ChildrenType & { params: Params }) {
    const { locale } = await params

    const session = await auth()
    if (!session?.user?.token) redirect(getLocalizedUrl('/logout', locale))

    const dictPromise = getDictionaryCached(locale)

    const systemData = await formService.getSystemInfo({
        sessiontoken: (await getServerBackendToken()) as string,
        language: locale
    })

    if (systemData.status === 401 || systemData?.payload?.requireLogout) {
        redirect(getLocalizedUrl('/logout', locale))
    }

    if (systemData.status !== 200) return <Spinner />

    const datapayload = systemData?.payload?.dataresponse
    if (!datapayload) return <ErrorPage error="Missing dataresponse" side="server" />

    // auth/bad request error codes => logout
    if (
        datapayload?.errors?.some(
            (err: any) =>
                parseInt(err.key) === AUTHENTICATION_ERROR_STATUS ||
                parseInt(err.key) === BAD_REQUEST
        )
    ) {
        redirect(getLocalizedUrl('/logout', locale))
    }

    if (!isValidResponse(systemData) || (datapayload.errors?.length ?? 0) > 0) {
        const e = datapayload.errors?.[0]
        return handleApiError({ locale, error: e, dictionary: await dictPromise })
    }

    const datainput = datapayload.data
    const avatar = datainput?.avatar ?? ''
    const name = datainput?.name ?? ''
    const role = datainput?.role ?? ''
    const roleChannel = datainput?.role_channel || []
    const isfirstlogin = session.user.is_first_login ?? datainput?.is_first_login ?? false
    const dictionary = await dictPromise

    if (isfirstlogin) {
        return (
            <Providers initialAvatar={avatar} initialUserInfo={datainput} initialMenuData={[]}>
                <ChangePassword dictionary={dictionary} session={session} locale={locale} />
            </Providers>
        )
    }

    // Menu is NOT fetched here anymore: menu permissions can depend on the selected project's
    // scope, which is only known client-side (per-user localStorage) once ProjectContext
    // resolves. DashboardContent gates on that, then loads the menu itself before rendering
    // any sidebar/header. See useDashboardMenu / DashboardContent.
    return (
        <Providers initialAvatar={avatar} initialUserInfo={datainput} initialMenuData={[]}>
            <AuthGuard locale={locale} dictionary={dictionary}>
                <IdleTimer locale={locale}>
                    <GlobalSignalRLogoutListener dictionary={dictionary} locale={locale} />

                    <DashboardContent
                        dictionary={dictionary}
                        locale={locale}
                        sessiontoken={toClientSessionToken(session) ?? ''}
                        avatar={avatar}
                        name={name}
                        role={role}
                        roleChannel={roleChannel}
                    >
                        {children}
                    </DashboardContent>
                </IdleTimer>
            </AuthGuard>
        </Providers>
    )
}
