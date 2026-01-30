import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@utils/getDictionary'
import ServiceInstanceContent from '@/views/nolayout/service/service-instance'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const ServiceInstancePage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <ServiceInstanceContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default ServiceInstancePage
