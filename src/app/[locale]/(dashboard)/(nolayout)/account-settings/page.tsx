import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { dataService } from '@/servers/system-service'
import { UserAccount } from '@shared/types/bankType'
import { getDictionary } from '@utils/getDictionary'
import { isValidResponse } from '@utils/isValidResponse'
import AccountSettingContent from '@/views/nolayout/account-settings/account-setting-content'
import Logout from '@features/auth/hooks/useLogout'
import jwt from 'jsonwebtoken'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const AccountSettingPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    if (!session) {
        return <Logout locale={locale} dictionary={dictionary}/>;
    }

    const token = session?.user?.token
    const decodedToken = jwt.decode(token as string) as { usercode?: string } | null
    const usercode = decodedToken?.usercode

    const dataviewAPI = await dataService.viewData({
        sessiontoken: session?.user?.token as string,
        learnapi: 'cbs_workflow_execute',
        workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
        commandname: "userview",
        issearch: false,
        parameters: { id: usercode },
    });

    if (
        !isValidResponse(dataviewAPI) ||
        (dataviewAPI.payload.dataresponse.errors && dataviewAPI.payload.dataresponse.errors.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            dataviewAPI.payload.dataresponse.errors[0].execute_id +
            ' - ' +
            dataviewAPI.payload.dataresponse.errors[0].info
        );
        return <Spinner />;
    }

    const userdata = dataviewAPI.payload.dataresponse.data.input.data[0] as UserAccount;


    const dataSearchAPI = await dataService.searchData({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
        commandname: "SimpleSearchUserSession",
        searchtext: usercode,
        pageSize: 9999,
        pageIndex: 1,
    });


    if (
        !isValidResponse(dataSearchAPI) ||
        (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            dataSearchAPI.payload.dataresponse.errors[0].execute_id +
            ' - ' +
            dataSearchAPI.payload.dataresponse.errors[0].info
        );
        return <Spinner />;
    }

    const useractivity = dataSearchAPI.payload.dataresponse.data.input 

    return (
        <Suspense fallback={<Spinner />}>
            <AccountSettingContent userdata={userdata} useractivity={useractivity} dictionary={dictionary} locale={locale} session={session} />
        </Suspense>
    )
}

export default AccountSettingPage
