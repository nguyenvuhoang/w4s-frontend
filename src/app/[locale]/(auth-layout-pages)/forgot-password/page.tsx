import AuthLayout, { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import ForgetPassword from '@/views/pages/auth/ForgetPassword';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Login');

const ForgotPasswordPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <AuthLayout params={(await props.params)}>
            {({ mode, dictionary, locale }) => (
                <ForgetPassword mode={mode} dictionary={dictionary} locale={locale} />
            )}
        </AuthLayout>
    );
};

export default ForgotPasswordPage;