import AuthLayout, { generateAuthMetadata } from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { i18n, Locale } from '@/configs/i18n';
import Login from '@/views/pages/auth/Login';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Login');

export async function generateStaticParams() {
    return i18n.locales.map((l) => ({ locale: l }));
}
const LoginPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <Suspense fallback={<Spinner />}>
            <AuthLayout params={(await props.params)}>
                {({ mode, dictionary, locale }) => (
                    <Login mode={mode} dictionary={dictionary} locale={locale} />
                )}
            </AuthLayout>
        </Suspense>
    );
};

export default LoginPage;