import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import CoreSessionContent from '@/views/nolayout/core-session'
import CoreSessionSkeleton from '@/views/nolayout/core-session/CoreSessionSkeleton'
import CoreSessionError from '@/views/nolayout/core-session/CoreSessionError'
import { Suspense } from 'react'
import ContentWrapper from '@/views/components/layout/content-wrapper'
import WebhookIcon from '@mui/icons-material/Webhook'

type Params = Promise<{
    locale: Locale
}>

async function CoreSessionData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const dataSearchAPI = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "CBG_EXECUTE_SQL",
        input: {
          commandname: "SimpleSearchCoreSession",
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
        (dataSearchAPI.payload.dataresponse.error && dataSearchAPI.payload.dataresponse.error.length > 0)
    ) {
        const execute_id = dataSearchAPI.payload.dataresponse.error[0]?.execute_id
        const errorinfo = dataSearchAPI.payload.dataresponse.error[0]?.info
        console.log(
            'ExecutionID:',
            execute_id +
            ' - ' +
            errorinfo
        );
        return <CoreSessionError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const transactiondata = dataSearchAPI.payload.dataresponse.fo[0].input

    return <CoreSessionContent dictionary={dictionary} session={session} transactiondata={transactiondata} locale={locale} />
}

const CoreSessionPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            icon={<WebhookIcon sx={{ fontSize: 40, color: "#0C9150" }} />}
            title={dictionary["coresession"].title}
            description={dictionary["coresession"].description}
            dictionary={dictionary}
        >
            <Suspense fallback={<CoreSessionSkeleton dictionary={dictionary} />}>
                <CoreSessionData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default CoreSessionPage
