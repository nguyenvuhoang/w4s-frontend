import { auth } from '@/auth'
import Spinner from '@/components/spinners'
import { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { ContractType } from '@/types/bankType'
import { PageData } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import { isValidResponse } from '@/utils/isValidResponse'
import CalendarContent from '@/views/nolayout/calendar'
import { Suspense } from 'react'

type Params = Promise<{
    locale: Locale
}>

const CalendarPage = async ({ params }: { params: Params }) => {
    const { locale } = await params

    const [dictionary, session] = await Promise.all([
        getDictionary(locale),
        auth()
    ]);

    const calendarAPI = await workflowService.runFODynamic({
        sessiontoken: session?.user?.token as string,
        workflowid: "BO_RETRIEVE_CALENDAR",
        input: {
            page_index: 1,
            page_size: 10,
            year: 2025,
            month: 10
        },
    });

    if (
        !isValidResponse(calendarAPI) ||
        (calendarAPI.payload.dataresponse.errors && calendarAPI.payload.dataresponse.errors.length > 0)
    ) {
        const execute_id = calendarAPI.payload.dataresponse.errors[0].execute_id
        const errorinfo = calendarAPI.payload.dataresponse.errors[0].info
        console.log(
            'ExecutionID:',
            execute_id +
            ' - ' +
            errorinfo
        );
        return <Spinner />;
    }

    const calendarData = calendarAPI.payload.dataresponse.data.input as PageData<ContractType>;

    return (
        <Suspense fallback={<Spinner />}>
            <CalendarContent dictionary={dictionary} session={session} locale={locale} calendarData={calendarData} />
        </Suspense>
    )
}

export default CalendarPage
