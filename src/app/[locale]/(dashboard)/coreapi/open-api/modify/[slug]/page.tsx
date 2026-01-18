import { auth } from '@/auth';
import { generateAuthMetadata } from '@/components/layout/AuthLayout';
import Spinner from '@/components/spinners';
import { Locale } from '@/configs/i18n';
import { systemServiceApi } from '@/servers/system-service';
import { ResponseDefaultData } from '@/types';
import { OpenAPIType } from '@/types/systemTypes';
import { getDictionary } from '@/utils/getDictionary';
import { isValidResponse } from '@/utils/isValidResponse';
import OpenAPIModifyContent from '@/views/api/open-api/modify';
import { Metadata } from 'next';

export const metadata: Metadata = generateAuthMetadata('OpenAPI management view');

const OpenAPIModify = async (props: {
    params: Promise<{
        locale: Locale,
        slug: string
    }>
}) => {
    const { locale, slug } = await props.params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const openAPIdataApi = await systemServiceApi.viewData({
        sessiontoken: session?.user?.token as string,
        learnapi: 'cbs_workflow_execute',
        workflowid: 'BO_EXECUTE_SQL_FROM_CMS',
        commandname: 'viewcoreapikey',
        issearch: false,
        parameters: { id: slug },
    });

    if (
        !isValidResponse(openAPIdataApi) ||
        (openAPIdataApi.payload.dataresponse.error && openAPIdataApi.payload.dataresponse.error.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            openAPIdataApi.payload.dataresponse.error[0].execute_id +
            ' - ' +
            openAPIdataApi.payload.dataresponse.error[0].info
        );
        return <Spinner />;
    }

    const openAPIdata = openAPIdataApi.payload.dataresponse.fo[0].input.data[0] as unknown as ResponseDefaultData<OpenAPIType>;

    return (
        <OpenAPIModifyContent session={session} dictionary={dictionary} locale={locale} openAPIdata={openAPIdata} />
    );
};

export default OpenAPIModify;