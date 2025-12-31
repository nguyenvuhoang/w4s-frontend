import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { i18n, Locale } from '@/configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import DashboardPageContent from '@/views/nolayout/dashboard'
import Logout from '@/views/pages/auth/Logout'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

const DashboardPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    if (!session) {
        return <Logout locale={locale} dictionary={dictionary} />;
    }

    return (
        <Suspense fallback={<Spinner />}>
            <DashboardPageContent />
        </Suspense>
    )
}

export default DashboardPage
