import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FacilityBookingsContent from '@/features/facility-bookings/components/FacilityBookingsContent'
import { facilityBookingService } from '@/features/facility-bookings/services/facilityBookingService'
import { FacilityBookingWorkflowError } from '@/features/facility-bookings/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import Logout from '@features/auth/hooks/useLogout'
import { getDictionary } from '@utils/getDictionary'

import { parseFacilityBookingFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

const FacilityBookingsPage = async ({
    params,
    searchParams
}: {
    params: Promise<{ locale: Locale }>
    searchParams?: Promise<SearchParams>
}) => {
    const { locale } = await params
    const search_params = await searchParams ?? {}
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
    const initial_filter = parseFacilityBookingFilter(search_params)
    let initial_data = facilityBookingService.get_default_response(initial_filter)
    let initial_error: string | null = null

    try {
        initial_data = await facilityBookingService.simpleSearchFacilityBookings({
            sessiontoken: (await getServerBackendToken()) ?? undefined,
            language: locale,
            filter: initial_filter
        })
    } catch (error) {
        if (error instanceof FacilityBookingWorkflowError && error.next_action === 'logout') {
            return <Logout locale={locale} dictionary={dictionary} />
        }

        initial_error = error instanceof Error
            ? error.message
            : dictionary.facility_bookings?.load_failed ?? dictionary.common?.servererror
        logger.error('[facility-bookings] Unable to load initial data', error)
    }

    return (
        <AuthorizedLayout requiredPath="/facilities/bookings" params={{ locale }}>
            {() => (
                <FacilityBookingsContent
                    dictionary={dictionary}
                    session={session}
                    locale={locale}
                    initial_filter={{
                        ...initial_filter,
                        page_index: initial_data.page_index,
                        page_size: initial_data.page_size
                    }}
                    initial_data={initial_data}
                    initial_error={initial_error}
                />
            )}
        </AuthorizedLayout>
    )
}

export default FacilityBookingsPage
