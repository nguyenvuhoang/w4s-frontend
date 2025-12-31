import { auth } from '@/auth';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { getDictionary } from '@/utils/getDictionary';
import DesignForm from '@/views/pages/design-form';
import { Suspense } from 'react';

type Params = Promise<{
    locale: Locale
    slug: string[]
}>


const DesignFormPage = async ({ params }: { params: Params }) => {
    const { locale, slug } = await params;

    const action = slug[0]
    const id = slug[1]

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    return (
        <Suspense fallback={<Spinner />}>
            <DesignForm dictionary={dictionary} session={session} action={action} />
        </Suspense>
    );
};


export default DesignFormPage