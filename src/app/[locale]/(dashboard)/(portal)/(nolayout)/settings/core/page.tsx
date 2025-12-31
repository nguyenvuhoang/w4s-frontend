import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi } from '@/servers/system-service'
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

    const dataCoreAPI = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.BO_LOAD_CONNECTION_CORE_BANKING
    });


    if (
        !isValidResponse(dataCoreAPI) ||
        (dataCoreAPI.payload.dataresponse.error && dataCoreAPI.payload.dataresponse.error.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            dataCoreAPI.payload.dataresponse.error[0].execute_id +
            ' - ' +
            dataCoreAPI.payload.dataresponse.error[0].info
        );
        return <Spinner />;
    }

    const coreconfigdata = dataCoreAPI.payload.dataresponse.fo[0].input

    return (
        <Suspense fallback={<Spinner />}>
            <CoreBankingConnectionSettingContent dictionary={dictionary} session={session} configdata={coreconfigdata} />
        </Suspense>
    )
}

export default CoreBankingConnectionSettingPage
