import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import PageError from '@/components/PageError';
import { Locale } from '@/configs/i18n';
import { WORKFLOWCODE } from '@/data/WorkflowCode';
import { systemServiceApi } from '@/servers/system-service';
import { OpenAPIType, PageData } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import OpenAPIManagementContent from '@/views/api/open-api';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('OpenAPI management');

const OpenAPIManagement = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const openAPIdataApi = await systemServiceApi.searchData({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.BO_EXECUTE_SQL_FROM_CMS,
        commandname: "SimpleSearchCoreAPIKeys",
        searchtext: '',
        pageSize: 10,
        pageIndex: 1,
        parameters: {
            status: '',
            query: '',
            environment: ''
        }
    });

    if (
        !isValidResponse(openAPIdataApi) ||
        (openAPIdataApi.payload.dataresponse.errors && openAPIdataApi.payload.dataresponse.errors.length > 0)
    ) {
        const errorInfo = openAPIdataApi.payload?.dataresponse?.errors?.[0];
        const executionId = errorInfo?.execute_id;
        const errorDetails = errorInfo?.info;
        return (
            <PageError
                title="Failed to load OpenAPI data"
                message="We couldn't retrieve the OpenAPI management data. Please try again or contact support if the problem persists."
                errorDetails={errorDetails}
                executionId={executionId}
            />
        );
    }


    const openAPIdata = openAPIdataApi.payload.dataresponse.data as unknown as PageData<OpenAPIType>;

    return (
        <OpenAPIManagementContent session={session} dictionary={dictionary} locale={locale} openAPIdata={openAPIdata} />
    );
};

export default OpenAPIManagement;