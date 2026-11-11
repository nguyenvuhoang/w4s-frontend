import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ApartmentResidentManagementPage from '@/features/properties/unit/ApartmentResidentManagementPage'
import { toClientSessionToken } from '@utils/safeSessionToken'

type Params = Promise<{
    locale: Locale
}>

type SearchParams = Promise<{
    apartment_id?: string
}>

const parseApartmentId = (value?: string) => {
    const parsed = Number(value)

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const ApartmentResidentManagementRoutePage = async ({ params, searchParams }: { params: Params; searchParams: SearchParams }, admin = false) => {
    const resolvedParams = await params
    const resolvedSearchParams = await searchParams
    const apartmentId = parseApartmentId(resolvedSearchParams.apartment_id)

    return (
        <AuthorizedLayout requiredPath={propertyPath('unit', admin)} params={resolvedParams}>
            {({ dictionary, session }) => (
                <PropertyRouteProvider admin={admin}>
                <ApartmentResidentManagementPage
                    dictionary={dictionary}
                    sessiontoken={toClientSessionToken(session) ?? ''}
                    apartmentId={apartmentId}
                />
                </PropertyRouteProvider>
            )}
        </AuthorizedLayout>
    )
}

export default ApartmentResidentManagementRoutePage
