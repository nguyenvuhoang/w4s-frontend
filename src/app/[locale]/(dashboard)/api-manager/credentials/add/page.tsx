import { auth } from '@/auth';
import OpenAPIAddContent from '@/components/api-manager/credentials/add';
import { Locale } from '@/configs/i18n';
import { generateAuthMetadata } from '@/shared/components/layout/AuthLayout';
import { getDictionary } from '@/shared/utils/getDictionary';
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