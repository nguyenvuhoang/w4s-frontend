import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AssetCreatePage from '@/features/assets/AssetCreatePage'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const AssetCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/assets/assets" requiredAction="ADD" params={{ locale }}>
      {() => (
        <AssetCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default AssetCreateRoute
