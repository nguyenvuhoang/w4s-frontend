import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import PageError from '@/components/PageError';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
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
        workflowid: "BO_EXECUTE_SQL_FROM_CMS",
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
        (openAPIdataApi.payload.dataresponse.error && openAPIdataApi.payload.dataresponse.error.length > 0)
    ) {
        const executionid = openAPIdataApi.payload.dataresponse.error[0].execute_id;
        const errordetail = openAPIdataApi.payload.dataresponse.error[0].info;
        return <PageError errorDetails={errordetail} executionId={executionid} />
    }

    const openAPIdata = openAPIdataApi.payload.dataresponse.fo[0].input as unknown as PageData<OpenAPIType>;

    return (
        <OpenAPIManagementContent session={session} dictionary={dictionary} locale={locale} openAPIdata={openAPIdata} />
    );
};

export default OpenAPIManagement;