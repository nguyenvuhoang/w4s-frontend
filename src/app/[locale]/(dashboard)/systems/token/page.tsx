import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { coreGetWayServiceApi } from '@/servers/coregateway-service'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import TokenInformation from '@/views/systems/token'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const TokenPage = async ({ params }: { params: Params }) => {

    const { locale } = await params;

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth(),
    ]);

    const coregatewayApi = await coreGetWayServiceApi.coreGatewaySearchInfo({
        sessiontoken: session?.user?.token as string,
        language: locale,
        commandname: 'SimpleSearchToken',
        pageIndex: 1,
        pageSize: 10
    })

    if (
        !isValidResponse(coregatewayApi) ||
        (coregatewayApi.payload.dataresponse.error && coregatewayApi.payload.dataresponse.error.length > 0)
    ) {
        console.log(
            'ExecutionID:',
            coregatewayApi.payload.dataresponse.error[0].execute_id +
            ' - ' +
            coregatewayApi.payload.dataresponse.error[0].info
        );
        return <Spinner />;
    }

    const tokendata = coregatewayApi.payload.dataresponse.fo[0].input;



    return (
        <Suspense fallback={<Spinner />}>
            <TokenInformation dictionary={dictionary} session={session} locale={locale} tokendata={tokendata} />
        </Suspense>
    )
}

export default TokenPage
