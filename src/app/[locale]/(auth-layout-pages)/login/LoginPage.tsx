import AuthLayout from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { Suspense } from 'react';
import Login from './components/Login';

const LoginPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <Suspense fallback={<Spinner />}>
            <AuthLayout params={(await props.params)}>
                {({ dictionary, locale }) => (
                    <Login dictionary={dictionary} locale={locale} />
                )}
            </AuthLayout>
        </Suspense>
    );
};

export default LoginPage;
