import { auth } from '@/auth';
import LearnAPIManagementContent from '@/components/api-manager/apis';
import { Locale } from '@/configs/i18n';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { generateAuthMetadata } from '@/shared/components/layout/AuthLayout';
import PageError from '@/shared/components/PageError';
import { LearnAPIType, PageData } from '@/shared/types/systemTypes';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('APIs');

const ApisPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const learnAPIDataApi = await learnAPIService.search({
        sessiontoken: session?.user?.token as string,
        language: locale,
        pageindex: 1,
        pagesize: 10,
        searchtext: '',
    });

    if (
        !isValidResponse(learnAPIDataApi) ||
        (learnAPIDataApi.payload.dataresponse.errors && learnAPIDataApi.payload.dataresponse.errors.length > 0)
    ) {
        const executionid = learnAPIDataApi.payload.dataresponse.errors?.[0]?.execute_id ?? '';
        const errordetail = learnAPIDataApi.payload.dataresponse.errors?.[0]?.info ?? 'Unknown error';
        return <PageError errorDetails={errordetail} executionId={executionid} />;
    }

    const learnAPIData = learnAPIDataApi.payload.dataresponse.data as unknown as PageData<LearnAPIType>;
    return (
        <LearnAPIManagementContent
            session={session}
            dictionary={dictionary}
            locale={locale}
            learnAPIData={learnAPIData}
        />
    );
};

export default ApisPage;
