import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import ContractCreatePage from '@/features/contracts/ContractCreatePage'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const ContractCreateRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/contracts/contracts" requiredAction="ADD" params={{ locale }}>
      {() => (
        <ContractCreatePage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default ContractCreateRoute
