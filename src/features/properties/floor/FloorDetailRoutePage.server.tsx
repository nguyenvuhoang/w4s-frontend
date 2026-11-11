import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'

import FloorDetailPage from '@/features/properties/floor/FloorDetailPage'
import { floorService } from '@/features/properties/floor/floorService'
import type { FloorDetailModel } from '@/features/properties/floor/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
  locale: Locale
  id: string
}>

const FloorDetailRoutePage = async ({ params }: { params: Params }, admin = false) => {
  const { locale, id } = await params
  return (
    <AuthorizedLayout requiredPath={propertyPath('floor', admin)} params={{ locale }}>
      {async ({ dictionary }) => {
        const floorId = Number(id)
        const sessiontoken = (await getServerBackendToken()) ?? undefined

        let initialFloor: FloorDetailModel | null = null
        let initialError: string | null = null

        if (!Number.isInteger(floorId) || floorId <= 0) {
          initialError = dictionary.propertyManagement?.floorNotFound ?? 'Floor not found.'
        } else {
          try {
            initialFloor = await floorService.getFloorById({
              sessiontoken,
              language: locale,
              id: floorId
            })

            if (!initialFloor) {
              initialError = dictionary.propertyManagement?.floorNotFound ?? 'Floor not found.'
            }
          } catch (err) {
            initialError = err instanceof Error ? err.message : (dictionary.propertyManagement?.floorLoadError ?? 'Unable to load floor detail.')
          }
        }
        return (
          <PropertyRouteProvider admin={admin}>
            <FloorDetailPage
              dictionary={dictionary}
              locale={locale}
              floorId={floorId}
              initialFloor={initialFloor}
              initialError={initialError}
            />
          </PropertyRouteProvider>
        )
      }}
    </AuthorizedLayout>
  )
}

export default FloorDetailRoutePage
