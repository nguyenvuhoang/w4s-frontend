import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import PageError from '@/components/PageError';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { ResponseDefaultData } from '@/types';
import { OpenAPIType, OpenAPITypeView } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import OpenAPIModifyContent from '@/views/api/open-api/modify';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('OpenAPI management modify');

const OpenAPIModify = async (props: {
    params: Promise<{
        locale: Locale,
        slug: string[]
    }>
}) => {
    const { locale, slug } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const client_id = slug[0];
    const environment = slug[1] || 'PRODUCTION';

    const openAPIdataApi = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.BO_RETRIVE_COREAPI,
        input: {
            client_id: client_id,
            environment: environment
        }
    });

    if (
        !isValidResponse(openAPIdataApi) ||
        (openAPIdataApi.payload.dataresponse.error && openAPIdataApi.payload.dataresponse.error.length > 0)
    ) {
        const execute_id = openAPIdataApi.payload.dataresponse.error[0].execute_id;
        const error_info = openAPIdataApi.payload.dataresponse.error[0].info;
        return <PageError executionId={execute_id} errorDetails={error_info} />;
    }

    const openAPIdata = openAPIdataApi.payload.dataresponse.fo[0].input as unknown as OpenAPITypeView;
    return (
        <OpenAPIModifyContent session={session} dictionary={dictionary} locale={locale} openAPIdata={openAPIdata} />
    );
};

export default OpenAPIModify;