import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import ContractManagementViewContent from '@/views/contracts/contract-management-view-content';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = generateAuthMetadata('Contract management view');

const ContractManagementView = async (props: { params: Promise<{ locale: Locale, slug: string[] | undefined; }> }) => {

    return (
        (
            <Suspense fallback={<Spinner />}>
                <SessionLayout params={(await props.params)}>
                    {({ dictionary, locale, session, dataview }) => (
                        <ContractManagementViewContent session={session} dictionary={dictionary} locale={locale} contractdata={dataview} />
                    )}
                </SessionLayout>
            </Suspense>
        )
    );
};

export default ContractManagementView;