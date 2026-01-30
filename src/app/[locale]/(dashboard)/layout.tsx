// src/app/[locale]/(dashboard)/(portal)/layout.tsx
import Navbar from '@/@layouts/components/vertical/Navbar'
import HorizontalLayout from '@/@layouts/HorizontalLayout'
import LayoutWrapper from '@/@layouts/LayoutWrapper'
import VerticalLayout from '@/@layouts/VerticalLayout'
import GlobalSignalRLogoutListener from '@components/GlobalSignalRLogoutListener'
import Navigation from '@components/layout/vertical/Navigation'
import Providers from '@components/Providers'
import Spinner from '@components/spinners'
import AuthGuard from '@/hocs/AuthGuard'
import IdleTimer from '@/hocs/IdleTimer'
import ErrorPage from '@/views/Error'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import HeaderHorizontal from '@components/layout/horizontal/Header'
import { Skeleton } from '@mui/material'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { InitUserStore } from '@/@core/stores/InitUserStore'
import { auth } from '@/auth'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { AUTHENTICATION_ERROR_STATUS, BAD_REQUEST } from '@/servers/lib/http'
import { formService, workflowService } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import { isValidResponse } from '@utils/isValidResponse'
import type { Locale } from '@configs/i18n'
import { i18n } from '@configs/i18n'
import type { ChildrenType } from '@core/types'
import { unstable_cache as cache } from 'next/cache'
import { cookies } from 'next/headers'
import ChangePassword from '../(auth-layout-pages)/change-password/components'
import SelectAppContent from '../../../features/applications/components/SelectAppContent'
import { env } from '@/env.mjs'

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
async function PortalLayoutContent({ children, params }: ChildrenType & { params: Params }) {
    const { locale } = await params

    const session = await auth()
    if (!session?.user?.token) redirect(getLocalizedUrl('/logout', locale))

    const dictPromise = getDictionaryCached(locale)

    const systemData = await formService.getSystemInfo({
        sessiontoken: session.user.token as string,
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
        return (
            <ErrorPage
                error={e ? `ExecutionID:${e.execute_id} - ${e.info}` : 'Unknown server error'}
                side="server"
            />
        )
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
            <Providers initialAvatar={avatar}>
                <ChangePassword dictionary={dictionary} session={session} locale={locale} />
            </Providers>
        )
    }

    const menudata = await workflowService.runFODynamic({
        sessiontoken: session.user.token as string,
        language: locale,
        workflowid: WORKFLOWCODE.WF_BO_LOAD_MENU,
        input: { channel_id: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO' }
    })

    const menupayload = menudata?.payload?.dataresponse
    if (!isValidResponse(menudata) || (menupayload?.errors?.length ?? 0) > 0) {
        const e = menupayload?.errors?.[0]
        return (
            <ErrorPage
                error={e ? `ExecutionID:${e.execute_id} - ${e.info}` : 'Unknown server error'}
                side="server"
            />
        )
    }

    const usercommand = menupayload.data?.data as any[] ?? []

    // Mock API Manager Menu
    usercommand.push({
        label: 'API Manager',
        icon: 'ri-dashboard-flow',
        command_type: 'M',
        children: [
            { label: 'Overview', href: '/api-manager/overview', icon: 'ri-bar-chart-2-line', command_type: 'M' },
            { label: 'APIs', href: '/api-manager/apis', icon: 'ri-api-line', command_type: 'M' },
            { label: 'Products', href: '/api-manager/products', icon: 'ri-box-3-line', command_type: 'M' },
            { label: 'Subscriptions', href: '/api-manager/subscriptions', icon: 'ri-vip-crown-line', command_type: 'M' },
            { label: 'Consumers', href: '/api-manager/consumers', icon: 'ri-user-star-line', command_type: 'M' },
            { label: 'Credentials', href: '/api-manager/credentials', icon: 'ri-key-2-line', command_type: 'M' },
            { label: 'Policies', href: '/api-manager/policies', icon: 'ri-shield-check-line', command_type: 'M' },
            {
                label: 'Gateway',
                icon: 'ri-server-line',
                command_type: 'M',
                children: [
                    { label: 'Routes', href: '/api-manager/gateway/routes', command_type: 'M' },
                    { label: 'Upstreams', href: '/api-manager/gateway/upstreams', command_type: 'M' }
                ]
            },
            { label: 'Quota', href: '/api-manager/quota', icon: 'ri-speed-mini-fill', command_type: 'M' },
            { label: 'Analytics', href: '/api-manager/analytics', icon: 'ri-line-chart-line', command_type: 'M' },
            { label: 'Logs', href: '/api-manager/logs', icon: 'ri-file-list-line', command_type: 'M' },
            { label: 'Environments', href: '/api-manager/environments', icon: 'ri-cloud-line', command_type: 'M' },
            { label: 'Settings', href: '/api-manager/settings', icon: 'ri-settings-4-line', command_type: 'M' },
        ]
    });

    return (
        <Providers initialAvatar={avatar}>
            <AuthGuard locale={locale} dictionary={dictionary}>
                <IdleTimer locale={locale}>
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
                                header={<HeaderHorizontal
                                    menu={usercommand}
                                    avatar={avatar}
                                    name={name}
                                    dictionary={dictionary}
                                    roleChannel={roleChannel}
                                />}
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
