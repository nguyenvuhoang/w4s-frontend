import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import GenerateQRTellerAppContent from '@/views/contracts/generate-qr-tellerapp-content';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Generate QR Teller Mobile App');

const GenerateQRTellerApp = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <SessionLayout params={(await props.params)}>
            {({ dictionary, locale, session }) => (
                <GenerateQRTellerAppContent session={session} dictionary={dictionary} locale={locale} />
            )}
        </SessionLayout>
    );
};

export default GenerateQRTellerApp;