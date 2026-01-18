import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import CoreOutboundContent from '@/views/nolayout/core-outbound'
import CoreOutboundSkeleton from '@/views/nolayout/core-outbound/CoreOutboundSkeleton'
import CoreOutboundError from '@/views/nolayout/core-outbound/CoreOutboundError'
import { Suspense } from 'react'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

type Params = Promise<{
    locale: Locale
}>

async function CoreOutboundData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const dataSearchAPI = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "CBG_EXECUTE_SQL",
        input: {
          commandname: "SimpleSearchCoreOutbound",
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
        return <CoreOutboundError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const transactiondata = dataSearchAPI.payload.dataresponse.fo[0].input

    return <CoreOutboundContent dictionary={dictionary} session={session} transactiondata={transactiondata} locale={locale}/>
}

const CoreOutboundPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            icon={<ReceiptLongIcon sx={{ fontSize: 40, color: "#0C9150" }} />}
            title={dictionary["coreoutbound"].title}
            description={dictionary["coreoutbound"].description}
            dictionary={dictionary}
        >
            <Suspense fallback={<CoreOutboundSkeleton dictionary={dictionary} />}>
                <CoreOutboundData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default CoreOutboundPage
