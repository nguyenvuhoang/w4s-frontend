import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import UserDeviceViewContent from '@/views/nolayout/user-device/view'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
    slug: string[] | undefined;
}>

const UserDeviceViewPage = async ({ params }: { params: Params }) => {
    const { locale, slug } = await params

    const transactionnumber = slug && slug.length > 0 ? slug[slug.length - 1] : undefined;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    const dataviewAPI = await systemServiceApi.viewData({
        sessiontoken: session?.user?.token as string,
        learnapi: 'cbs_workflow_execute',
        workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
        commandname: 'viewuserdevice',
        issearch: false,
        parameters: { id: transactionnumber },
    });


    if (
        !isValidResponse(dataviewAPI) ||
        (dataviewAPI.payload.dataresponse.error && dataviewAPI.payload.dataresponse.error.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            dataviewAPI.payload.dataresponse.error[0].execute_id +
            ' - ' +
            dataviewAPI.payload.dataresponse.error[0].info
        );
        return <Spinner />;
    }

    const viewdata = dataviewAPI.payload.dataresponse.fo[0].input.data[0];

    return (
        <Suspense fallback={<Spinner />}>
            <UserDeviceViewContent
                dictionary={dictionary}
                session={session}
                transactionnumber={transactionnumber}
                viewdata={viewdata}
            />
        </Suspense>
    )
}

export default UserDeviceViewPage
