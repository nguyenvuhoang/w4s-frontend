import AuthLayout, { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import VerifyDevice from '@/views/pages/auth/VerifyDevice';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Login');

const VerifyDevicePage = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <AuthLayout params={(await props.params)}>
            {({ mode, dictionary, locale }) => (
                <VerifyDevice mode={mode} dictionary={dictionary} locale={locale} />
            )}
        </AuthLayout>
    );
};

export default VerifyDevicePage;