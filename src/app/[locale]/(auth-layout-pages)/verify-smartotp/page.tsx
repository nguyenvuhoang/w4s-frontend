import { auth } from '@/auth';
import { Locale } from '@/configs/i18n';
import { getDictionary } from '@/utils/getDictionary';
import { getServerMode } from '@/utils/serverHelpers';
import VerificationScreen from '@/views/forms/auth/verify-smartotp';
import { Suspense } from 'react';

const VerificationSmartOTP = async (props: { params: Promise<{ locale: Locale }> }) => {
    const params = await props.params;
    const mode = await getServerMode()

    const [dictionary, session] = await Promise.all([
        getDictionary(params.locale),
        auth()
    ]);

    return (
        <Suspense fallback={null}>
            <VerificationScreen
                mode={mode}
                dictionary={dictionary}
                locale={params.locale}
                session={session}
            />
        </Suspense>
    );
};

export default VerificationSmartOTP;
