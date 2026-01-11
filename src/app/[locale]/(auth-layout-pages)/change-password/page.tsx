import { auth } from '@/auth';
import AuthLayout, { generateAuthMetadata } from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { getLocalizedUrl } from '@/utils/i18n';
import ChangePassword from '@/views/ChangePassword';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Login');

const ChangePasswordPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;
    const session = await auth()

    if (!session || !session.user || session.user.token?.length === 0) {
        console.log('[Portal Layout] No session found, redirecting to logout')
        redirect(getLocalizedUrl('/logout', locale))
    }
    return (
        <Suspense fallback={<Spinner />}>
            <AuthLayout params={(await props.params)}>
                {({ mode, dictionary, locale }) => (
                    <ChangePassword dictionary={dictionary} session={session} />
                )}
            </AuthLayout>
        </Suspense>
    );
};

export default ChangePasswordPage;