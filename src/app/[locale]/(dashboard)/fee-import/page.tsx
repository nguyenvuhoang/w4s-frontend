import { auth } from '@/auth'
import { type Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FeeImportListPage from '@/features/fees/fee-import/FeeImportListPage'
import { getDictionary } from '@utils/getDictionary'
import { toClientSessionToken } from '@utils/safeSessionToken'

export default async function FeeImportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params; const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  return <AuthorizedLayout requiredPath='/fee-import' params={{ locale }}>{() => <FeeImportListPage dictionary={dictionary} locale={locale} sessiontoken={toClientSessionToken(session) ?? undefined} />}</AuthorizedLayout>
}
