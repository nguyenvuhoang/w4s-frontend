import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import BuildingManagementPage from '@/features/properties/building/BuildingManagementPage'
import { buildingService } from '@/features/properties/building/buildingService'
import { emptyBuildingFilter } from '@/features/properties/building/buildingHelpers'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

const BuildingPage = async ({ params }: { params: Params }, admin = false) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const initialFilter = emptyBuildingFilter
  const initialData = buildingService.getDefaultBuildingResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath={propertyPath('building', admin)} params={{ locale }}>
      {() => (<PropertyRouteProvider admin={admin}>
        <>
          <BuildingManagementPage
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

export default BuildingPage
