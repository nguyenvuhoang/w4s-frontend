import AuthorizedLayout from '@components/layout/AuthorizedLayout'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeExcelImportPage from '@/features/fees/fee-import/FeeExcelImportPage'
import { getDictionary } from '@/shared/utils/getDictionary'
import { toClientSessionToken } from '@/shared/utils/safeSessionToken'

type Params = Promise<{ locale: Locale }>

export default async function FeeExcelImportRoute({ params }: { params: Params }) {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath='/fees/import' requiredAction='ADD' params={{ locale }}>
      {() => <FeeExcelImportPage dictionary={dictionary} locale={locale} sessiontoken={toClientSessionToken(session) ?? undefined} />}
    </AuthorizedLayout>
  )
}
