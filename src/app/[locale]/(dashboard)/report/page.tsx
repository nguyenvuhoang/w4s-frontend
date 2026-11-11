import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { reportService } from '@/features/report/service'
import { emptyReportFilter } from '@/features/report/components/reportHelpers'
import type { ReportWorkflowError } from '@/features/report/types'
import ReportManagementPage from '@/features/report/ReportManagementPage'
import { getDictionary } from '@utils/getDictionary'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import { Suspense } from 'react'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
    locale: Locale
}>

const ReportPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    let initialData = reportService.getDefaultSearchResponse(emptyReportFilter)
    let initialError: ReportWorkflowError | null = null

    try {
        initialData = await reportService.searchReports({
            sessiontoken: (await getServerBackendToken()) ?? undefined,
            language: locale,
            filter: emptyReportFilter
        })
    } catch (error) {
        initialError = normalizeWorkflowErrorDetail(error, {
            fallback: 'Unable to load reports.'
        })
        logger.error('[report] Unable to load initial data', error)
    }

    return (
        <Suspense fallback={<Spinner />}>
            <ReportManagementPage
                dictionary={dictionary}
                session={session}
                locale={locale}
                initialFilter={{
                    ...emptyReportFilter,
                    page_index: initialData.page_index,
                    page_size: initialData.page_size
                }}
                initialData={initialData}
                initialError={initialError}
            />
        </Suspense>
    )
}

export default ReportPage