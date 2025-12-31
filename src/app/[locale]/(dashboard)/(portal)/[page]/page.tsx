import { auth } from '@/auth'
import PageError from '@/components/PageError'
import Spinner from '@/components/spinners'
import { i18n, Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import DynamicPageGeneric from '@/views/pages/dynamic-page-generic'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
    page: string
}>
export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}
const DynamicPage = async ({ params }: { params: Params }) => {
    const { locale, page } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    const pageid = page.replace(/-/g, '_');

    const pagecontentApi = await systemServiceApi.loadFormInfo({
        sessiontoken: session?.user?.token as string,
        language: locale,
        formid: pageid
    })

    if (!isValidResponse(pagecontentApi)) {
        const errorDetails = pagecontentApi.payload.dataresponse.errors[0].info;
        return <PageError errorDetails={errorDetails} />;
    }

    const pagecontentdetail = pagecontentApi.payload.dataresponse.data
    const formdesigndetail = pagecontentdetail.form_design_detail

    return (
        <Suspense fallback={<Spinner />}>
            <DynamicPageGeneric
                formdesigndetail={formdesigndetail}
                session={session}
                dictionary={dictionary}
                language={locale}
            />
        </Suspense>
    )
}

export default DynamicPage
