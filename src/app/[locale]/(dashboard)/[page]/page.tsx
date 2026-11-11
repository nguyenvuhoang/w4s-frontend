import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import PageError from '@components/PageError'
import UnderDevelopmentPage from '@components/UnderDevelopmentPage'
import { i18n, Locale } from '@/configs/i18n'
import { formService } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { getFormLoadState } from '@utils/formLoadState'
import DynamicForm from './components/dynamic-form'
import ManagementPage from '@/features/management/ManagementPage'
import { findManagementScreenByPath } from '@/features/management/config'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
    locale: Locale
    page: string
}>
export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}
const DynamicPage = async ({ params }: { params: Params }) => {
    const resolvedParams = await params
    const { locale, page } = resolvedParams
    const dictionary = await getDictionary(locale)

    const managementRoute = `/${page}`
    const managementConfig = findManagementScreenByPath(managementRoute)

    if (managementConfig) {
        return (
            <AuthorizedLayout
                requiredPath={managementRoute}
                params={resolvedParams}
            >
                {() => <ManagementPage config={managementConfig} />}
            </AuthorizedLayout>
        )
    }

    const session = await auth();

    const pageid = page.replace(/-/g, '_');

    const pagecontentApi = await formService.loadFormInfo({
        sessiontoken: (await getServerBackendToken()) as string,
        language: locale,
        formid: pageid
    })

    const formLoadState = getFormLoadState(pagecontentApi)

    if (formLoadState.type === 'under-development') {
        return (
            <UnderDevelopmentPage
                title={dictionary.common?.under_development_title ?? 'Feature is under development'}
                description={dictionary.common?.under_development_description ?? 'This feature is not ready yet. Please come back later.'}
                backLabel={dictionary.common?.back ?? 'Back'}
                homeLabel={dictionary.common?.back_to_home ?? dictionary.common?.home ?? 'Home'}
                homeHref={`/${locale}/dashboards`}
                badgeLabel={dictionary.common?.under_development_badge ?? 'Module status'}
                progressLabel={dictionary.common?.under_development_progress ?? 'Preparing workspace'}
                terminalLines={[
                    dictionary.common?.under_development_terminal_checking ?? '> checking module status...',
                    dictionary.common?.under_development_terminal_status ?? '> feature status: under development',
                    dictionary.common?.under_development_terminal_estimated ?? '> estimated: coming soon'
                ]}
            />
        )
    }

    if (formLoadState.type === 'error') {
        return (
            <PageError
                errorDetails={formLoadState.errorDetails}
                executionId={formLoadState.executionId}
            />
        )
    }

    const pagecontentdetail = formLoadState.data

    const formdesigndetail = pagecontentdetail.form_design_detail
    const roleTask = pagecontentdetail.loadRoleTask;
    return (
        <AuthorizedLayout
            requiredPath={`/${page}`}
            params={resolvedParams}
        >
            {({ session, dictionary, locale }) => (
                <DynamicForm
                    formdesigndetail={formdesigndetail}
                    session={session}
                    dictionary={dictionary}
                    language={locale}
                    roleTask={roleTask}
                />
            )}
        </AuthorizedLayout>
    )
}

export default DynamicPage
