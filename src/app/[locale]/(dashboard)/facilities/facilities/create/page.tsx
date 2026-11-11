import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FacilityCreatePage from '@/features/facilities/components/FacilityCreatePage'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { toClientSessionToken } from '@utils/safeSessionToken'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const FacilityCreateRoute = async ({ params }: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/facilities/facilities" requiredAction="ADD" params={{ locale }}>
      {() => (
        <FacilityCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FacilityCreateRoute
