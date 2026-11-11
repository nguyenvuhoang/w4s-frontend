import Spinner from '@components/spinners';
import { i18n, Locale } from '@/configs/i18n';
import { Suspense } from 'react';
import DashboardPageContent from './components';
import { getDictionary } from '@utils/getDictionary';

type Params = Promise<{
    locale: Locale
}>;

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

const DashboardPage = async ({ params }: { params: Params }) => {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);

    return (
        <Suspense fallback={<Spinner />}>
            <DashboardPageContent dictionary={dictionary} />
        </Suspense>
    );
};

export default DashboardPage;
