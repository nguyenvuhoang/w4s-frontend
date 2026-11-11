import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeExcelImportPage from '@/features/fees/fee-import/FeeExcelImportPage'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
  locale: Locale
}>

const GenerateFeeRoute = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout
      requiredPath="/fees/generate-fee"
      permissionHref="/fee-management"
      requiredAction="ADD"
      params={{ locale }}
    >
      {() => (
        <FeeExcelImportPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
        />
      )}
    </AuthorizedLayout>
  )
}

export default GenerateFeeRoute
