import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import VendorCreatePage from '@/features/contracts/VendorCreatePage'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const VendorCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/contracts/company" requiredAction="ADD" params={{ locale }}>
      {() => (
        <VendorCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default VendorCreateRoute
