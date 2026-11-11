import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ApartmentCreatePage from '@/features/properties/unit/ApartmentCreatePage'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const ApartmentCreateRoute = async ({ params }: { params: Params }, admin = false) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <AuthorizedLayout requiredPath={propertyPath('unit', admin)} requiredAction={admin ? undefined : "ADD"} params={{ locale }}>
      {() => (<PropertyRouteProvider admin={admin}><ApartmentCreatePage dictionary={dictionary} session={session} locale={locale} /></PropertyRouteProvider>)}
    </AuthorizedLayout>
  )
}

export default ApartmentCreateRoute
