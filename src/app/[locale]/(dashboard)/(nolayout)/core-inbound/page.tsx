import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import CoreInboundContent from '@/views/nolayout/core-inbound'
import CoreInboundSkeleton from '@/views/nolayout/core-inbound/CoreInboundSkeleton'
import CoreInboundError from '@/views/nolayout/core-inbound/CoreInboundError'
import { Suspense } from 'react'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

type Params = Promise<{
    locale: Locale
}>

async function CoreInboundData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const dataSearchAPI = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "CBG_EXECUTE_SQL",
        input: {
          commandname: "SimpleSearchCoreInbound",
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
        return <CoreInboundError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const transactiondata = dataSearchAPI.payload.dataresponse.fo[0].input

    return <CoreInboundContent dictionary={dictionary} session={session} transactiondata={transactiondata} locale={locale}/>
}

const CoreInboundPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            icon={<ReceiptLongIcon sx={{ fontSize: 40, color: "#0C9150" }} />}
            title={dictionary["coreinbound"].title}
            description={dictionary["coreinbound"].description}
            dictionary={dictionary}
        >
            <Suspense fallback={<CoreInboundSkeleton dictionary={dictionary} />}>
                <CoreInboundData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default CoreInboundPage
