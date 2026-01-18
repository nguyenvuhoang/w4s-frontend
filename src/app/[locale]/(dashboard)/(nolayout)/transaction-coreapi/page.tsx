import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import TransactionCoreAPIContent from '@/views/nolayout/transaction-coreapi'
import TransactionCoreAPISkeleton from '@/views/nolayout/transaction-coreapi/TransactionCoreAPISkeleton'
import TransactionCoreAPIError from '@/views/nolayout/transaction-coreapi/TransactionCoreAPIError'
import { Suspense } from 'react'
import ContentWrapper from '@features/dynamicform/components/layout/content-wrapper'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

type Params = Promise<{
    locale: Locale
}>

async function TransactionCoreAPIData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const dataSearchAPI = await systemServiceApi.searchSystemData({
        sessiontoken: session?.user?.token as string,
        workflowid: `CBG_TRANSACTION_SEARCH`,
        searchtext: '',
        pageSize: 10,
        pageIndex: 0
    })

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
        return <TransactionCoreAPIError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const transactiondata = dataSearchAPI.payload.dataresponse.fo[0].input

    return <TransactionCoreAPIContent dictionary={dictionary} session={session} transactiondata={transactiondata} />
}

const TransactionCoreAPIPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            icon={<ReceiptLongIcon sx={{ fontSize: 40, color: '#0C9150' }} />}
            title={`${dictionary['transactioncoreapi'].title} - ${dictionary['common'].view}`}
            description={dictionary['transactioncoreapi'].description}
            dictionary={dictionary}
        >
            <Suspense fallback={<TransactionCoreAPISkeleton dictionary={dictionary} />}>
                <TransactionCoreAPIData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default TransactionCoreAPIPage
