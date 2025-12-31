import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import EmailSettingContent from '@/views/nolayout/settings/store-command'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const EmailSettingPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <EmailSettingContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default EmailSettingPage
