import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import UserDeviceContent from '@/views/nolayout/user-device'
import { PageData } from '@/types/systemTypes'
import { UserDeviceType } from '@/types/bankType'
import UserDeviceSkeleton from '@/views/nolayout/user-device/UserDeviceSkeleton'
import UserDeviceError from '@/views/nolayout/user-device/UserDeviceError'
import { Suspense } from 'react'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import { SystemSecurityUpdateGood } from '@mui/icons-material'
import { WORKFLOWCODE } from '@/data/WorkflowCode'

type Params = Promise<{
    locale: Locale
}>

async function UserDeviceData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const dataSearchAPI = await workflowService.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: WORKFLOWCODE.WF_BO_EXECUTE_SQL_FROM_CTH,
        input: {
            commandname: "SimpleSearchUserDevice",
            issearch: true,
            pageindex: 1,
            pagesize: 10,
            parameters: {
                searchtext: '',
            },
        },
    });

    if (
        !isValidResponse(dataSearchAPI) ||
        (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
    ) {
        const execute_id = dataSearchAPI.payload.dataresponse.errors[0]?.execute_id
        const errorinfo = dataSearchAPI.payload.dataresponse.errors[0]?.info
        console.log(
            'ExecutionID:',
            execute_id +
            ' - ' +
            errorinfo
        );
        return <UserDeviceError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const transactiondata = dataSearchAPI.payload.dataresponse.data.input as PageData<UserDeviceType>

    return <UserDeviceContent dictionary={dictionary} session={session} transactiondata={transactiondata} locale={locale} />
}

const UserDevicePage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper
            icon={<SystemSecurityUpdateGood sx={{ fontSize: 40, color: "#0C9150" }} />}
            title={dictionary["userdevice"].title}
            description={dictionary["userdevice"].description}
            dictionary={dictionary}
        >
            <Suspense fallback={<UserDeviceSkeleton dictionary={dictionary} />}>
                <UserDeviceData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default UserDevicePage
