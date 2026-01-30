import { auth } from '@/auth'
import Spinner from '@components/spinners'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { getDictionary } from '@utils/getDictionary'
import { isValidResponse } from '@utils/isValidResponse'
import SystemCodeContent from '@/views/nolayout/system-code'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const SystemCodePage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    // if (
    //     !isValidResponse(dataSearchAPI) ||
    //     (dataSearchAPI.payload.dataresponse.errors && dataSearchAPI.payload.dataresponse.errors.length > 0)
    // ) {
    //     console.log(
    //         'ExecutionID:',
    //         dataSearchAPI.payload.dataresponse.errors[0].execute_id +
    //         ' - ' +
    //         dataSearchAPI.payload.dataresponse.errors[0].info
    //     );
    //     return <Spinner />;
    // }

    // const smsdata = dataSearchAPI.payload.dataresponse.data.input

    return (
        <Suspense fallback={<Spinner />}>
            <SystemCodeContent dictionary={dictionary} session={session} />
        </Suspense>
    )
}

export default SystemCodePage
