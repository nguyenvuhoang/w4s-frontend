import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ServiceRequestsContent from '@/features/service-requests/components/ServiceRequestsContent'
import { serviceRequestService } from '@/features/service-requests/services/serviceRequestService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { parseServiceRequestsFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import logger from '@lib/logger'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const ServiceRequestsPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseServiceRequestsFilter(search_params)
  let initialData = serviceRequestService.getDefaultResponse(initialFilter)
  let initialError: string | null = null

  try {
    initialData = await serviceRequestService.simpleSearchServiceRequests({
      sessiontoken: session?.user?.token ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    initialError = error instanceof Error ? error.message : null
    logger.error('[service-requests] Unable to load initial data', error)
  }

  return (
    <AuthorizedLayout requiredPath="/service-requests/service-requests" params={{ locale }}>
      {() => (
        <ServiceRequestsContent
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={{
            ...initialFilter,
            page_index: initialData.page_index,
            page_size: initialData.page_size
          }}
          initialData={initialData}
          initialError={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ServiceRequestsPage
