import { auth } from '@/auth'
import PageError from '@/components/PageError'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import CoreBankingConnectionSettingContent from '@/views/nolayout/settings/core'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const CoreBankingConnectionSettingPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    const dataCoreAPI = await workflowService.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.BO_LOAD_CONNECTION_CORE_BANKING
    });


    if (
        !isValidResponse(dataCoreAPI) ||
        (dataCoreAPI.payload.dataresponse.errors && dataCoreAPI.payload.dataresponse.errors.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            dataCoreAPI.payload.dataresponse.errors[0].execute_id +
            ' - ' +
            dataCoreAPI.payload.dataresponse.errors[0].info
        );
        const executionId = dataCoreAPI.payload.dataresponse.errors[0].execute_id || '';
        const errorDetails = dataCoreAPI.payload.dataresponse.errors[0].info || 'Unknown error';
        return <PageError errorDetails={errorDetails} executionId={executionId} />;
    }

    const coreconfigdata = dataCoreAPI.payload.dataresponse.data.input

    return (
        <Suspense fallback={<Spinner />}>
            <CoreBankingConnectionSettingContent dictionary={dictionary} session={session} configdata={coreconfigdata} />
        </Suspense>
    )
}

export default CoreBankingConnectionSettingPage
