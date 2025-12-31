import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import MonitoringHealthContent from '@/views/nolayout/monitoring/health'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
    slug: string[]
}>

const MonitoringHealthPage = async ({ params }: { params: Params }) => {
    const { locale, slug } = await params

    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

    return (
        <Suspense fallback={<Spinner />}>
            <MonitoringHealthContent session={session} dictionary={dictionary} />
        </Suspense>
    )
}

export default MonitoringHealthPage
