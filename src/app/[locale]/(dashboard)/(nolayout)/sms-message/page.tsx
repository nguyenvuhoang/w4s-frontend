import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { dataService, systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { isValidResponse } from '@utils/isValidResponse'
import SMSMessageContent from '@/views/nolayout/sms-message/sms-message-content'
import SMSMessageSkeleton from '@/views/nolayout/sms-message/SMSMessageSkeleton'
import SMSMessageError from '@/views/nolayout/sms-message/SMSMessageError'
import SMSHeaderWrapper from '@features/dynamicform/components/layout/sms-header-wrapper'
import { Suspense } from 'react'
import { Session } from 'next-auth'
import dayjs from 'dayjs'

type Params = Promise<{
    locale: Locale
}>

const SMSMessageData = async (
    {
        session,
        locale,
        dictionary
    }: {
        session: Session | null,
        locale: Locale,
        dictionary: Awaited<ReturnType<typeof getDictionary>>
    }
) => {
    const today = dayjs().format('DD/MM/YYYY')

    const dataSearchAPI = await dataService.searchData({
        sessiontoken: session?.user?.token as string,
        workflowid: "BO_SEARCH_SMS_MESSAGE",
        commandname: "SimpleSearchSMSSendOut",
        searchtext: "",
        pageSize: 10,
        pageIndex: 1,
        parameters: {
            phonenumber: '',
            providername: 'ALL',
            fromdate: today,
            todate: today,
            status: 'ALL',
        },
    });

    if (
        !isValidResponse(dataSearchAPI) ||
        (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
    ) {
        const error = dataSearchAPI.payload.dataresponse.errors?.[0];
        const executionId = error?.execute_id;
        const errorInfo = error?.info;
        return (
            <SMSMessageError
                executionId={executionId}
                errorInfo={errorInfo}
                dictionary={dictionary}
            />
        );
    }

    const smsdata = dataSearchAPI.payload.dataresponse.data.input

    return (
        <SMSMessageContent
            dictionary={dictionary}
            session={session}
            initialData={smsdata}
        />
    )
}

const SMSMessagePage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <SMSHeaderWrapper
            title={`${dictionary['sms']?.report ?? 'SMS Report'}`}
        >
            <Suspense fallback={<SMSMessageSkeleton dictionary={dictionary} />}>
                <SMSMessageData session={session} locale={locale} dictionary={dictionary} />
            </Suspense>
        </SMSHeaderWrapper>
    )
}

export default SMSMessagePage
