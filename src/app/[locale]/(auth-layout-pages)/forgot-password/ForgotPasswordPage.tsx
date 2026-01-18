import AuthLayout, { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { Metadata } from 'next';
import ForgetPassword from './components/ForgetPassword';
import { auth } from '@/auth';

export const metadata: Metadata = generateAuthMetadata('Login');

const ForgotPasswordPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const session = await auth()
    return (
        <AuthLayout params={(await props.params)}>
            {({ dictionary, locale }) => (
                <ForgetPassword session={session} dictionary={dictionary} locale={locale} />
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
