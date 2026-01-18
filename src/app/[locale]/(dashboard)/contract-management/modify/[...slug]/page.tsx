import ResolvedProps from '@/@core/components/ResolvedProps';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import { Metadata } from 'next';
import ContractManagementModifyWrapper from './ContractManagementModifyWrapper';

export const metadata: Metadata = generateAuthMetadata('Contract Management Add');

const ContractManagementModify = async (props: { params: Promise<{ locale: Locale, slug: string[] | undefined }> }) => {
  const params = await props.params;
  return (
     <SessionLayout params={params}>
      {(p) => (
        <ResolvedProps Component={ContractManagementModifyWrapper} props={p} />
      )}
    </SessionLayout>
  );
};

export default ContractManagementModify;
