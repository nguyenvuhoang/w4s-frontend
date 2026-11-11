import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import ApartmentDetailPage from '@/features/properties/unit/ApartmentDetailPage'
import { apartmentSearchService } from '@/features/properties/unit/services/apartmentSearchService'
import type { ApartmentDetailResult } from '@/features/properties/unit/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
  locale: Locale
  id: string
}>

const ApartmentDetailRoutePage = async ({ params }: { params: Params }, admin = false) => {
  const { locale, id } = await params
  return (
    <AuthorizedLayout requiredPath={propertyPath('unit', admin)} params={{ locale }}>
      {async ({ dictionary }) => {
        const apartmentId = Number(id)
        const sessiontoken = (await getServerBackendToken()) ?? undefined

        let initialDetail: ApartmentDetailResult = { apartment: null, project: null, building: null, floor: null }
        let initialError: string | null = null

        if (!Number.isInteger(apartmentId) || apartmentId <= 0) {
          initialError = dictionary.propertyManagement?.apartmentNotFound ?? 'Apartment not found.'
        } else {
          try {
            initialDetail = await apartmentSearchService.getApartmentDetail({
              sessiontoken,
              language: locale,
              apartment_id: apartmentId
            })

            if (!initialDetail.apartment) {
              initialError = dictionary.propertyManagement?.apartmentNotFound ?? 'Apartment not found.'
            }
          } catch (err) {
            initialError = err instanceof Error ? err.message : (dictionary.propertyManagement?.apartmentLoadError ?? 'Unable to load apartment detail.')
          }
        }
        return (
          <PropertyRouteProvider admin={admin}>
            <ApartmentDetailPage
              dictionary={dictionary}
              locale={locale}
              apartmentId={apartmentId}
              initialDetail={initialDetail}
              initialError={initialError}
            />
          </PropertyRouteProvider>
        )
      }}
    </AuthorizedLayout>
  )
}

export default ApartmentDetailRoutePage
