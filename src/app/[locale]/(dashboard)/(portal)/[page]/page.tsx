import { auth } from '@/auth'
import AuthorizedLayout from '@/components/layout/AuthorizedLayout'
import PageError from '@/components/PageError'
import Spinner from '@/components/spinners'
import { i18n, Locale } from '@/configs/i18n'
import { formService } from '@/servers/system-service'
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

    const session = await auth();

    const pageid = page.replace(/-/g, '_');

    const pagecontentApi = await formService.loadFormInfo({
        sessiontoken: session?.user?.token as string,
        language: locale,
        formid: pageid
    })
    if (!isValidResponse(pagecontentApi)) {
        const errorDetails = pagecontentApi.payload.dataresponse.errors[0].info;
        return <PageError errorDetails={errorDetails} />;
    }

    const pagecontentdetail = pagecontentApi.payload.dataresponse.data.data

    const formdesigndetail = pagecontentdetail.form_design_detail
    const roleTask = pagecontentdetail.loadRoleTask;
    return (
        <AuthorizedLayout
            requiredPath={`/${page}`}
            params={await params}
        >
            {({ session, dictionary, locale }) => (
                <Suspense fallback={<Spinner />}>
                    <DynamicPageGeneric
                        formdesigndetail={formdesigndetail}
                        session={session}
                        dictionary={dictionary}
                        language={locale}
                        roleTask={roleTask}
                    />
                </Suspense>

            )}
        </AuthorizedLayout>
    )
}

export default DynamicPage
