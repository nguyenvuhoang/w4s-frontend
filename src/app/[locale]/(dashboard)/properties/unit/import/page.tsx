import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import UnitImportPage from '@/features/properties/unit/import/UnitImportPage'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const UnitImportRoutePage = async ({ params }: { params: Params }) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath="/properties/unit/import" requiredAction="IMPORT" params={{ locale }}>
      {() => (
        <UnitImportPage
          dictionary={dictionary}
          session={session}
          locale={locale}
        />
      )}
    </AuthorizedLayout>
  )
}

export default UnitImportRoutePage
