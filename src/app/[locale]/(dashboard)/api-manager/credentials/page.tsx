import { auth } from '@/auth';
import OpenAPIManagementContent from '@/components/api-manager/credentials';
import { Locale } from '@/configs/i18n';
import { workflowService } from '@/servers/system-service';
import { generateAuthMetadata } from '@/shared/components/layout/AuthLayout';
import PageError from '@/shared/components/PageError';
import { OpenAPIType, PageData } from '@/shared/types/systemTypes';
import { getDictionary } from '@/shared/utils/getDictionary';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('Credentials');

const CredentialsPage = async (props: { params: Promise<{ locale: Locale }> }) => {
    const { locale } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const openAPIdataApi = await workflowService.loadApiKeys({
        sessiontoken: session?.user?.token as string,
        language: locale,
        pageindex: 1,
        pagesize: 10,
        searchtext: '',
    });

    if (
        !isValidResponse(openAPIdataApi) ||
        (openAPIdataApi.payload.dataresponse.errors && openAPIdataApi.payload.dataresponse.errors.length > 0)
    ) {
        const executionid = openAPIdataApi.payload.dataresponse.errors[0].execute_id;
        const errordetail = openAPIdataApi.payload.dataresponse.errors[0].info;
        return <PageError errorDetails={errordetail} executionId={executionid} />
    }

    const openAPIdata = (openAPIdataApi.payload.dataresponse.data) as unknown as PageData<OpenAPIType>;
    return (
        <OpenAPIManagementContent session={session} dictionary={dictionary} locale={locale} openAPIdata={openAPIdata} />
    );
};

export default CredentialsPage;
