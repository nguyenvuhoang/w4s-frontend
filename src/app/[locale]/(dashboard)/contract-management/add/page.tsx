import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import { Metadata } from 'next';
import ContractManagementAddWrapper from './ContractManagementAddWrapper';
import ResolvedProps from '@/@core/components/ResolvedProps';

export const metadata: Metadata = generateAuthMetadata('Contract Management Add');

const ContractManagementAdd = async (props: {
  params: Promise<{ locale: Locale; slug: string[] | undefined }>;
}) => {
  const params = await props.params;

  return (
    <SessionLayout params={params}>
      {(p) => (
        // Không spread p trực tiếp nữa -> dùng ResolvedProps để await mọi field có thể async
        <ResolvedProps Component={ContractManagementAddWrapper} props={p} />
      )}
    </SessionLayout>
  );
};

export default ContractManagementAdd;
