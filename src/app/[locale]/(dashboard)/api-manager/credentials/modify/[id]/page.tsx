import { auth } from '@/auth';
import OpenAPIModifyContent from '@/components/api-manager/credentials/modify/index';
import { Locale } from '@/configs/i18n';
import { workflowService } from '@/servers/system-service';
import { generateAuthMetadata } from '@/shared/components/layout/AuthLayout';
import PageError from '@/shared/components/PageError';
import { OpenAPIType } from '@/shared/types/systemTypes';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('OpenAPI management modify');

const ModifyCredentialPage = async (props: { params: Promise<{ locale: Locale, id: string }> }) => {
    const { locale, id } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const openAPIdataApi = await workflowService.viewAPIKey({
        sessiontoken: session?.user?.token as string,
        language: locale,
        fields: {
            client_id: id
        }
    });

    if (
        !isValidResponse(openAPIdataApi) ||
        (openAPIdataApi.payload.dataresponse.errors && openAPIdataApi.payload.dataresponse.errors.length > 0)
    ) {
        const executionid = openAPIdataApi.payload.dataresponse.errors?.[0]?.execute_id;
        const errordetail = openAPIdataApi.payload.dataresponse.errors?.[0]?.info || 'Error loading credential';
        return <PageError errorDetails={errordetail} executionId={executionid} />
    }

    const openAPIdata = (openAPIdataApi.payload.dataresponse.data?.input || openAPIdataApi.payload.dataresponse.data) as unknown as OpenAPIType;

    return (
        <OpenAPIModifyContent session={session} dictionary={dictionary} locale={locale} data={openAPIdata} />
    );
};

export default ModifyCredentialPage;
