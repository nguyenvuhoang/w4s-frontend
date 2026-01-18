import Spinner from '@/components/spinners';
import { i18n, Locale } from '@/configs/i18n';
import { Suspense } from 'react';
import DashboardPageContent from './components';

type Params = Promise<{
    locale: Locale
}>;

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

const DashboardPage = async ({ params }: { params: Params }) => {
    return (
        <Suspense fallback={<Spinner />}>
            <DashboardPageContent />
        </Suspense>
    );
};

export default DashboardPage;
