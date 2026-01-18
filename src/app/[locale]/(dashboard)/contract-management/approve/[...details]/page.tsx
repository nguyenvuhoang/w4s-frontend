import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import ContractManagementApproveContent from '@/views/contracts/contract-management-approve-content';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Contract management - Approve');

const ContractManagementApprove = async (props: { params: Promise<{ locale: Locale, details: string[] | undefined; }> }) => {

    return (
        <SessionLayout params={(await props.params)}>
            {({ dictionary, locale, session, dataview }) => (
                <ContractManagementApproveContent session={session} dictionary={dictionary} locale={locale} contractdata={dataview} />
            )}
        </SessionLayout>
    );
};

export default ContractManagementApprove;