import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'

import BuildingDetailPage from '@/features/properties/building/BuildingDetailPage'
import { buildingService } from '@/features/properties/building/buildingService'
import type { BuildingDetailModel, ProjectBuildingSummaryModel } from '@/features/properties/building/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

type Params = Promise<{
    locale: Locale
    id: string
}>

const BuildingDetailRoutePage = async ({ params }: { params: Params }, admin = false) => {
    const { locale, id } = await params
    return (
        <AuthorizedLayout requiredPath={propertyPath('building', admin)} params={{ locale }}>
            {async ({ dictionary }) => {
              const buildingId = Number(id)
              const sessiontoken = (await getServerBackendToken()) ?? undefined

              let initialBuilding: BuildingDetailModel | null = null
              let initialProjectBuildingSummary: ProjectBuildingSummaryModel = {
                  total_floors: 0,
                  total_apartments: 0,
                  total_residents: 0
              }
              let initialError: string | null = null

              if (!Number.isInteger(buildingId) || buildingId <= 0) {
                  initialError = dictionary.propertyManagement?.buildingNotFound ?? 'Building not found.'
              } else {
                  try {
                      const response = await buildingService.getBuildingById({
                          sessiontoken,
                          language: locale,
                          id: buildingId
                      })

                      initialBuilding = response.building
                      initialProjectBuildingSummary = response.summary

                      if (!initialBuilding) {
                          initialError = dictionary.propertyManagement?.buildingNotFound ?? 'Building not found.'
                      }
                  } catch (err) {
                      initialError = err instanceof Error ? err.message : (dictionary.propertyManagement?.buildingLoadError ?? 'Unable to load building detail.')
                  }
              }
              return (
                <PropertyRouteProvider admin={admin}>
                    <BuildingDetailPage
                        dictionary={dictionary}
                        locale={locale}
                        buildingId={buildingId}
                        initialBuilding={initialBuilding}
                        initialProjectBuildingSummary={initialProjectBuildingSummary}
                        initialError={initialError}
                    />
                </PropertyRouteProvider>
              )
            }}
        </AuthorizedLayout>
    )
}

export default BuildingDetailRoutePage
