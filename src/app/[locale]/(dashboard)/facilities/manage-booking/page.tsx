import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FacilityBookingsContent from '@/features/facility-bookings/components/FacilityBookingsContent'
import { facilityBookingService } from '@/features/facility-bookings/services/facilityBookingService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { parseFacilityBookingFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const ManageBookingPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const initialFilter = parseFacilityBookingFilter(search_params)
  let initial_data = facilityBookingService.get_default_response(initialFilter)

  try {
    initial_data = await facilityBookingService.simpleSearchFacilityBookings({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    logger.error('[facility-bookings] Unable to load initial data', error)
  }

  return (
    <AuthorizedLayout requiredPath="/facilities/manage-booking" params={{ locale }}>
      {() => (
        <FacilityBookingsContent
          dictionary={dictionary}
          session={session}
          locale={locale}
          initial_filter={{
            ...initialFilter,
            page_index: initial_data.page_index,
            page_size: initial_data.page_size
          }}
          initial_data={initial_data}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ManageBookingPage
