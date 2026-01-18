import ResolvedProps from '@/@core/components/ResolvedProps';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import { Metadata } from 'next';
import AgentContractManagementAddWrapper from './AgentContractManagementAddWrapper';

export const metadata: Metadata = generateAuthMetadata('Agent Contract Management Add');

const ContractManagementAdd = async (props: { params: Promise<{ locale: Locale, slug: string[] | undefined }> }) => {
  const params = await props.params;
  return (

    <SessionLayout params={params}>
      {(p) => (
        <ResolvedProps Component={AgentContractManagementAddWrapper} props={p} />
      )}
    </SessionLayout>

  );
};

export default ContractManagementAdd;
