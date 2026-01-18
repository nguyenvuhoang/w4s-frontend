import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import NotificationConfigurationContent from '@/views/nolayout/notification-configuration'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const NotificationConfigurationPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <NotificationConfigurationContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default NotificationConfigurationPage
