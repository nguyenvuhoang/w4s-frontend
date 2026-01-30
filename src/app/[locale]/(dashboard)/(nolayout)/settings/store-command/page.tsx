import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { getDictionary } from '@utils/getDictionary'
import StoreCommandContent from '@/views/nolayout/settings/store-command'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const StoreCommandPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <StoreCommandContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default StoreCommandPage
