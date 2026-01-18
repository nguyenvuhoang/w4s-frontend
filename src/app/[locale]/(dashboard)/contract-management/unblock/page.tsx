import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import ContractManagementUnblockContent from '@/views/contracts/contract-unblock';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Contract unblock');

const ContractManagementUnblock = async (props: { params: Promise<{ locale: Locale }> }) => {
    return (
        <SessionLayout params={(await props.params)}>
            {({ dictionary, locale, session }) => (
                <ContractManagementUnblockContent session={session} dictionary={dictionary} locale={locale} />
            )}
        </SessionLayout>
    );
};

export default ContractManagementUnblock;