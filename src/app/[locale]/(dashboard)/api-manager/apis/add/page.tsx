import { auth } from '@/auth';
import LearnApiAdd from '@/components/api-manager/apis/add/LearnApiAdd';
import { Locale } from '@/configs/i18n';
import { generateAuthMetadata } from '@/shared/components/layout/AuthLayout';
import { getDictionary } from '@/shared/utils/getDictionary';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Add New Learn API');

const LearnApiAddPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <LearnApiAdd session={session} dictionary={dictionary} locale={locale} />
    );
};

export default LearnApiAddPage;
