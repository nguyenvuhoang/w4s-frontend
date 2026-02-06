import { auth } from '@/auth';
import LearnApiModify from '@/components/api-manager/apis/modify/LearnApiModify';
import { Locale } from '@/configs/i18n';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import PageError from '@/shared/components/PageError';
import { LearnAPIType } from '@/shared/types';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import { notFound } from 'next/navigation';


type Params = Promise<{
    locale: Locale
    apiId: string
}>


export default async function LearnApiModifyPage({ params }: { params: Params }) {
    const session = await auth();
    const { apiId, locale } = await params;

    const [dictionary, learnAPIDataApi] = await Promise.all([
        getDictionary(locale as any),
        learnAPIService.view({
            sessiontoken: session?.user?.token as string,
            language: locale as any,
            learn_api_id: apiId,
        })
    ]);

    if (
        !isValidResponse(learnAPIDataApi) ||
        (learnAPIDataApi.payload.dataresponse.errors && learnAPIDataApi.payload.dataresponse.errors.length > 0)
    ) {
        const executionid = learnAPIDataApi.payload.dataresponse.errors?.[0]?.execute_id ?? '';
        const errordetail = learnAPIDataApi.payload.dataresponse.errors?.[0]?.info ?? 'An error occurred while fetching API details.';
        return <PageError errorDetails={errordetail} executionId={executionid} />
    }

    const api = learnAPIDataApi.payload.dataresponse.data as unknown as LearnAPIType;

    if (!api) {
        notFound();
    }

    return (
        <LearnApiModify
            api={api}
            dictionary={dictionary}
            session={session}
            locale={locale as any}
        />
    );
}
