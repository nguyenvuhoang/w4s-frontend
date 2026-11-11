import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@utils/getDictionary'
import RenderReportDetail from '@/views/reports/renderreportdetail'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
    slug: string
}>

const ReportViewPage = async ({ params }: { params: Params }) => {
    const { locale, slug } = await params

    const dictionary = await getDictionary(locale)

    return (
        <Suspense fallback={<Spinner />}>
            <RenderReportDetail reportcode={slug} dictionary={dictionary} locale = {locale} />
        </Suspense>
    )
}

export default ReportViewPage
