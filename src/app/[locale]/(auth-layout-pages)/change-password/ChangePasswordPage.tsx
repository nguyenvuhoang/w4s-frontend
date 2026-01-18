import AuthLayout from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { Suspense } from 'react';
import ChangePassword from './components';
import { auth } from '@/auth';

const ChangePasswordPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;
    const session = await auth();
    return (
        <Suspense fallback={<Spinner />}>
            <AuthLayout params={(await props.params)}>
                {({ dictionary }) => (
                    <ChangePassword dictionary={dictionary} locale={locale} session={session} />
                )}
            </AuthLayout>
        </Suspense>
    );
};

export default ChangePasswordPage;
