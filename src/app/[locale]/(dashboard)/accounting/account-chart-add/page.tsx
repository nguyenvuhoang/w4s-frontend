import ResolvedProps from '@/@core/components/ResolvedProps';
import { generateAuthMetadata } from '@components/layout/AuthLayout';
import SessionLayout from '@components/layout/SessionLayout';
import { Locale } from '@/configs/i18n';
import { Metadata } from 'next';
import AccountChartAddWrapper from './AccountChartAddWrapper';

export const metadata: Metadata = generateAuthMetadata('Account Chart Add');

const AccountChartAdd = async (props: { params: Promise<{ locale: Locale, slug: string[] | undefined }> }) => {
  const params = await props.params;
  return (

    <SessionLayout params={params}>
      {(p) => (
        <ResolvedProps Component={AccountChartAddWrapper} props={p} />
      )}
    </SessionLayout>
  );
};

export default AccountChartAdd;
