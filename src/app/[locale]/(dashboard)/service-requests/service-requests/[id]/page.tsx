import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ServiceRequestDetailPage from '@/features/service-requests/ServiceRequestDetailPage'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
  id: string
  request_code?: string
}>

const ServiceRequestDetailRoute = async ({ params }: { params: Params }) => {
  const { locale, id, request_code } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const requestCode = decodeURIComponent(String(request_code ?? id ?? ''))

  return (
    <AuthorizedLayout requiredPath="/service-requests/service-requests" params={{ locale }}>
      {() => (
        <ServiceRequestDetailPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          requestCode={requestCode}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ServiceRequestDetailRoute
