import { auth } from '@/auth'
import PageError from '@components/PageError'
import Spinner from '@components/spinners'
import UnderDevelopmentPage from '@components/UnderDevelopmentPage'
import { i18n, Locale } from '@/configs/i18n'
import { dataService, formService } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { getFormLoadState } from '@utils/formLoadState'
import { isValidResponse } from '@utils/isValidResponse'
import Logout from '@features/auth/hooks/useLogout'
import DynamicPageGeneric from '@features/dynamicform/components/dynamic-page-generic'
import { Suspense } from 'react'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ManagementPage from '@/features/management/ManagementPage'
import { findManagementScreenByPath } from '@/features/management/config'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
    locale: Locale
    page: string
    slug: string[]
}>

type SearchParams = Record<string, string | string[] | undefined>

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

const DynamicPageAction = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
    const resolvedParams = await params
    const { locale, page, slug } = resolvedParams
    const search_params = await searchParams ?? {}

    const action = slug[0]
    const storename = slug[1]
    const id = slug[2]

    const managementRoute = `/${[page, ...slug].join('/')}`
    const managementConfig = findManagementScreenByPath(managementRoute)

    if (managementConfig) {
        return (
            <AuthorizedLayout requiredPath={managementRoute} params={resolvedParams}>
                {() => <ManagementPage config={managementConfig} />}
            </AuthorizedLayout>
        )
    }

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    if (!session) {
        return <Logout locale={locale} dictionary={dictionary} />;
    }

    const pageid = page.replace(/-/g, '_');
    const formid = `${pageid}_${action}`;

    const pagecontentApi = await formService.loadFormInfo({
        sessiontoken: (await getServerBackendToken()) as string,
        language: locale,
        formid,
    });

    const formLoadState = getFormLoadState(pagecontentApi)

    if (formLoadState.type === 'under-development') {
        // Fee notification screens don't have a dedicated route yet (see fees/fee-notifications),
        // so they land here via the catch-all. Give them a description that names the feature
        // instead of the generic one, without changing anything for every other under-development
        // page that also flows through this same branch.
        const isFeeNotificationsRoute = page === 'fees' && action === 'fee-notifications'
        const underDevelopmentDescription = isFeeNotificationsRoute
            ? dictionary.feeManagement?.feeNotificationsUnderDevelopmentDescription
            : undefined

        return (
            <UnderDevelopmentPage
                title={dictionary.common?.under_development_title ?? 'Feature is under development'}
                description={underDevelopmentDescription ?? dictionary.common?.under_development_description ?? 'This feature is not ready yet. Please come back later.'}
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

    const workflowid = formLoadState.data?.form_design_detail?.info?.data;
    const pagecontentdetail = formLoadState.data;
    const formdesigndetail = pagecontentdetail.form_design_detail;

    let pagedata: any = {};

    if (action !== "add" && storename && id) {

        const pagedataApi = await dataService.viewData({
            sessiontoken: (await getServerBackendToken()) as string,
            workflowid: workflowid ?? 'WF_BO_EXECUTE_SQL_FROM_CTH',
            commandname: storename,
            issearch: false,
            parameters: { id: id },
        });


        if (
            !isValidResponse(pagedataApi) ||
            (pagedataApi.payload.dataresponse.errors && pagedataApi.payload.dataresponse.errors.length > 0)
        ) {
            const executionId = pagedataApi.payload.dataresponse.errors[0].execute_id || '';
            const errorDetails = pagedataApi.payload.dataresponse.errors[0].info || 'Unknown error';
            return <PageError errorDetails={errorDetails} executionId={executionId} />;
        }

        pagedata = pagedataApi.payload.dataresponse.data[0];
    }

    return (
        <Suspense fallback={<Spinner />}>
            <DynamicPageGeneric
                formdesigndetail={formdesigndetail}
                session={session}
                dictionary={dictionary}
                language={locale}
                renderviewdata={pagedata}
                ismodify={action !== 'add'}
            />
        </Suspense>
    );
};

export default DynamicPageAction;
