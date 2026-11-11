import { propertyPath } from '@/features/properties/propertyPaths'
import { PropertyRouteProvider } from '@/features/properties/PropertyRouteContext'
import { auth } from '@/auth'
import { Locale } from '@/configs/i18n'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FloorManagementPage from '@/features/properties/floor/FloorManagementPage'
import { floorService } from '@/features/properties/floor/floorService'
import { emptyFloorFilter } from '@/features/properties/floor/floorHelpers'
import { getDictionary } from '@/shared/utils/getDictionary'

type Params = Promise<{
  locale: Locale
}>

type SearchParams = Promise<Record<string, string | string[] | undefined>>

// Positive integer id from a query value, otherwise null (never a guessed id).
const toContextId = (value: string | string[] | undefined) => {
  const id = Number(Array.isArray(value) ? value[0] : value)

  return Number.isInteger(id) && id > 0 ? id : null
}

const FloorPage = async ({ params, searchParams }: { params: Params; searchParams?: SearchParams }, admin = false) => {
  const { locale } = await params
  const query = (await searchParams) ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  // Set by the Floor detail when going back to the list (after Edit/Delete or "Back to floor list").
  const preferredContext = { project_id: toContextId(query.project_id), building_id: toContextId(query.building_id) }

  const initialFilter = emptyFloorFilter
  const initialData = floorService.getDefaultFloorResponse(initialFilter)

  return (
    <AuthorizedLayout requiredPath={propertyPath('floor', admin)} params={{ locale }}>
      {() => (<PropertyRouteProvider admin={admin}>
        <>
          <FloorManagementPage
            dictionary={dictionary}
            session={session}
            locale={locale}
            initialFilter={initialFilter}
            initialData={initialData}
            preferredContext={preferredContext}
          />
        </>
      </PropertyRouteProvider>)}
    </AuthorizedLayout>
  )
}

export default FloorPage
