import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import { Locale } from '@/configs/i18n';
import { getDictionary } from '@/utils/getDictionary';
import OpenAPIAddContent from '@/views/api/open-api/add';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('OpenAPI management add');

const OpenAPIManagement = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <OpenAPIAddContent session={session} dictionary={dictionary} locale={locale} />
    );
};

export default OpenAPIManagement;