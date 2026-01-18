import { auth } from '@/auth'
import PageError from '@/components/PageError'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { reportService } from '@/servers/system-service'
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


    const reportApi = await reportService.loadReport({
        sessiontoken: session?.user?.token as string,
        pageindex: 1,
        pagesize: 10
    })

    if (
        !isValidResponse(reportApi) ||
        (reportApi.payload.dataresponse.errors && reportApi.payload.dataresponse.errors.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            reportApi.payload.dataresponse.errors[0].execute_id +
            ' - ' +
            reportApi.payload.dataresponse.errors[0].info
        );
        const executionId = reportApi.payload.dataresponse.errors[0].execute_id;
        const errorDetails = reportApi.payload.dataresponse.errors[0].info;
        return <PageError executionId={executionId} errorDetails={errorDetails} />;
    }

    const reports = reportApi.payload.dataresponse.data.input

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