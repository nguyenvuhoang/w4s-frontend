import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import ConsoleAdminContent from '@/views/nolayout/console-admin/console-admin-content'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const ConsoleAdminPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <ConsoleAdminContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default ConsoleAdminPage
