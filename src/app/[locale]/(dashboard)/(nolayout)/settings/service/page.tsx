import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@utils/getDictionary'
import ServiceSettingsContent from '@/views/nolayout/settings/service'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const ServiceSettingsPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <ServiceSettingsContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default ServiceSettingsPage
