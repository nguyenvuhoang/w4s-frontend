import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { i18n, Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import DynamicPageGeneric from '@/views/pages/dynamic-page-generic'
import { Suspense } from 'react'
import Logout from '@/views/pages/auth/Logout'
import PageError from '@/components/PageError'

type Params = Promise<{
    locale: Locale
    page: string
    action: string
    slug: string
}>

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

const DynamicPageAction = async ({ params }: { params: Params }) => {
    const { locale, page, slug } = await params

    const action = slug[0]
    const storename = slug[1]
    const id = slug[2]
    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    if (!session) {
        return <Logout locale={locale} dictionary={dictionary} />;
    }

    const pageid = page.replace(/-/g, '_');
    const formid = `${pageid}_${action}`;

    const pagecontentApi = await systemServiceApi.loadFormInfo({
        sessiontoken: session?.user?.token as string,
        language: locale,
        formid,
    });

    if (!isValidResponse(pagecontentApi)) {
        return <PageError errorDetails='Failed to load form info' />;
    }
    const workflowid = pagecontentApi.payload.dataresponse.data.data?.form_design_detail?.info?.data;
    const pagecontentdetail = pagecontentApi.payload.dataresponse.data.data;
    const formdesigndetail = pagecontentdetail.form_design_detail;

    let pagedata: any = {};

    if (action !== "add" && storename && id) {

        const pagedataApi = await systemServiceApi.viewData({
            sessiontoken: session?.user?.token as string,
            workflowid: workflowid ?? 'WF_BO_EXECUTE_SQL_FROM_CTH',
            commandname: storename,
            issearch: false,
            parameters: { id: id },
        });


        if (
            !isValidResponse(pagedataApi) ||
            (pagedataApi.payload.dataresponse.error && pagedataApi.payload.dataresponse.error.length > 0)
        ) {
            console.log(
                'ExecutionID:',
                pagedataApi.payload.dataresponse.error[0].execute_id +
                ' - ' +
                pagedataApi.payload.dataresponse.error[0].info
            );
            return <Spinner />;
        }

        pagedata = pagedataApi.payload.dataresponse.fo[0].input.data[0];
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
