import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { splitLabel } from '@/utils/splitLabel';
import GenerateLayout from '@/views/components/layout/generate-layout';
import LayoutRenderer from '@/views/components/layout/layout-renderer';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug?: string[] }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const formCode = resolvedParams.slug?.[0] ?? 'kyc_view';
    return generateAuthMetadata(`View - ${splitLabel(formCode)}`);
}

const FormView = async (props: { params: Promise<{ locale: Locale; slug?: string[] }> }) => {
    const params = await props.params;
    return (
        <GenerateLayout params={Promise.resolve(params)}>
            {({ dictionary, locale, session, id, formdata, dataview }) => (
                <LayoutRenderer id={id} session={session} dictionary={dictionary} locale={locale} formdata={formdata} dataview={dataview} />
            )}
        </GenerateLayout>
    );
};

export default FormView;
