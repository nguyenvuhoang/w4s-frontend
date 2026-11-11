import type { Locale } from '@/configs/i18n'
import FeeInvoiceEditPage from '@/features/fees/FeeInvoiceEditPage'
import { feeService } from '@/features/fees/service'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

type Params = Promise<{ locale: Locale; id: string }>

const FeeInvoiceEditRoute = async ({ params }: { params: Params }) => {
  const { locale, id } = await params
  const feeInvoiceId = Number(id)
  const dictionary = await getDictionary(locale)
  const sessiontoken = await getServerBackendToken()
  const detail = Number.isInteger(feeInvoiceId) && feeInvoiceId > 0
    ? await feeService.getFeeDetailById({ sessiontoken: sessiontoken ?? undefined, language: locale, id: feeInvoiceId }).catch(() => null)
    : null

  return (
    <AuthorizedLayout requiredPath="/fee-management" requiredAction="MODIFY" params={{ locale }}>
      {({ session }) => <FeeInvoiceEditPage dictionary={dictionary} locale={locale} detail={detail} sessiontoken={session?.user?.token ?? undefined} />}
    </AuthorizedLayout>
  )
}

export default FeeInvoiceEditRoute
