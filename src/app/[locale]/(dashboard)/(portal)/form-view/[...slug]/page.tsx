import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { splitLabel } from '@/utils/splitLabel';
import DynamicLayout from '@/views/components/layout/dynamic-layout';
import DynamicRenderer from '@/views/components/layout/dynamic-renderer';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug?: string[] }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const formCode = resolvedParams.slug?.[0] ?? 'kyc_view';
    return generateAuthMetadata(`View - ${splitLabel(formCode)}`);
}


const KYCManagementView = async (props: { params: Promise<{ locale: Locale; slug?: string[] }> }) => {
    const params = await props.params;
    return (
        <DynamicLayout params={Promise.resolve(params)}>
            {({ dictionary, locale, session, id, formdata }) => (
                <DynamicRenderer id={id} session={session} dictionary={dictionary} locale={locale} formdata={formdata} />
            )}
        </DynamicLayout>
    );
};

export default KYCManagementView;
