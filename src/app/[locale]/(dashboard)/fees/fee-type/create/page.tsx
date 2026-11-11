import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeTypeCreatePage from '@/features/fees/FeeTypeCreatePage'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const FeeTypeCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/fees/fee-type" requiredAction="ADD" params={{ locale }}>
      {() => (
        <FeeTypeCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FeeTypeCreateRoute
