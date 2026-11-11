import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeInvoiceCreatePage from '@/features/fees/FeeInvoiceCreatePage'
import { getDictionary } from '@utils/getDictionary'

export default async function FeeInvoiceCreateRoute({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  return <AuthorizedLayout requiredPath="/fee-management" params={{ locale }}>{() => <FeeInvoiceCreatePage dictionary={dictionary} locale={locale} sessiontoken={session?.user?.token ?? undefined} />}</AuthorizedLayout>
}
