import Providers from '@/components/Providers';
import Spinner from '@/components/spinners';
import { i18n } from '@configs/i18n';
import { Suspense } from 'react';

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}

export default async function Layout(props: {
    children: React.ReactNode
}) {
    const { children } = props

    return (
        <Suspense fallback={<Spinner />}>
            <Providers initialAvatar="/images/logobank/emi.svg">
                {children}
            </Providers>
        </Suspense>
    )
}
