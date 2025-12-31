import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import ContractManagementBlockContent from '@/views/contracts/contract-lock';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Contract unblock');

const ContractManagementblock = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <SessionLayout params={(await props.params)}>
            {({ dictionary, locale, session }) => (
                <ContractManagementBlockContent session={session} dictionary={dictionary} locale={locale} />
            )}
        </SessionLayout>
    );
};

export default ContractManagementblock;