import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { APIError } from '@/utils/APIError'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import ReportPageContent from '@/views/reports'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const ReportPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);


    const reportApi = await systemServiceApi.loadReport({
        sessiontoken: session?.user?.token as string,
        pageindex: 1,
        pagesize: 10
    })

    if (
        !isValidResponse(reportApi) ||
        (reportApi.payload.dataresponse.error && reportApi.payload.dataresponse.error.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            reportApi.payload.dataresponse.error[0].execute_id +
            ' - ' +
            reportApi.payload.dataresponse.error[0].info
        );
        return <Spinner />;
    }

    const reports = reportApi.payload.dataresponse.fo[0].input

    return (
        <Suspense fallback={<Spinner />}>
            <ReportPageContent
                reports={reports}
                dictionary={dictionary}
                session={session}
                locale={locale}
            />
        </Suspense>
    )
}

export default ReportPage
