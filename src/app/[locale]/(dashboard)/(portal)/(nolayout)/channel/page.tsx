import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import { systemServiceApi } from '@/servers/system-service'
import { ChannelType } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import ChannelContent from '@/views/nolayout/channel'
import ChannelSkeleton from '@/views/nolayout/channel/ChannelSkeleton'
import ChannelError from '@/views/nolayout/channel/ChannelError'
import { Suspense } from 'react'
import ContentWrapper from '@/views/components/layout/content-wrapper'

type Params = Promise<{
    locale: Locale
}>

async function ChannelData({ locale, session }: { locale: Locale; session: any }) {
    const dictionary = await getDictionary(locale)

    const channelAPI = await systemServiceApi.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "BO_RETRIEVE_CHANNEL",
        input: {},
    });

    if (
        !isValidResponse(channelAPI) ||
        (channelAPI.payload.dataresponse.error && channelAPI.payload.dataresponse.error.length > 0)
    ) {
        const execute_id = channelAPI.payload.dataresponse.error[0]?.execute_id
        const errorinfo = channelAPI.payload.dataresponse.error[0]?.info
        console.log(
            'ExecutionID:',
            execute_id +
            ' - ' +
            errorinfo
        );
        return <ChannelError dictionary={dictionary} execute_id={execute_id} errorinfo={errorinfo} />
    }

    const channelData = channelAPI.payload.dataresponse.fo[0].input.data as ChannelType[];
    
    return <ChannelContent dictionary={dictionary} session={session} locale={locale} channelData={channelData} />
}

const ChannelPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    return (
        <ContentWrapper 
            title={dictionary['channel']?.title}
            description={dictionary['channel']?.description}
            icon={<></>}
            dictionary={dictionary}
            issearch={false}
        >
            <Suspense fallback={<ChannelSkeleton dictionary={dictionary} />}>
                <ChannelData locale={locale} session={session} />
            </Suspense>
        </ContentWrapper>
    )
}

export default ChannelPage
