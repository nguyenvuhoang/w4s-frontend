import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import BuildingCreatePage from '@/features/properties/building/BuildingCreatePage'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const BuildingCreateRoute = async ({ params }: { params: Params }, admin = false) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath={propertyPath('building', admin)} requiredAction={admin ? undefined : "ADD"} params={{ locale }}>
      {() => (<PropertyRouteProvider admin={admin}><BuildingCreatePage dictionary={dictionary} session={session} locale={locale} /></PropertyRouteProvider>)}
    </AuthorizedLayout>
  )
}

export default BuildingCreateRoute
