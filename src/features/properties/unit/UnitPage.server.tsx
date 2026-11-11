import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ApartmentManagementPage from '@/features/properties/unit/ApartmentManagementPage'
import { apartmentSearchService } from '@/features/properties/unit/services/apartmentSearchService'
import { emptyApartmentFilter } from '@/features/properties/unit/apartmentHelpers'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
    locale: Locale
}>

const UnitPage = async ({ params }: { params: Params }, admin = false) => {
    const { locale } = await params
    const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

    const initialFilter = emptyApartmentFilter
    const initialData = apartmentSearchService.getDefaultApartmentResponse(initialFilter)

    return (
        <AuthorizedLayout requiredPath={propertyPath('unit', admin)} params={{ locale }}>
            {() => (<PropertyRouteProvider admin={admin}>
                <>
                  <ApartmentManagementPage
                      dictionary={dictionary}
                      session={session}
                      locale={locale}
                      initialFilter={initialFilter}
                      initialData={initialData}
                  />
                </>
            </PropertyRouteProvider>)}
        </AuthorizedLayout>
    )
}

export default UnitPage
