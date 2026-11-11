import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FacilitiesManagementContent from '@/features/facilities/components/FacilitiesManagementContent'
import { facilityService } from '@/features/facilities/services/facilityService'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import {
  parseFacilitiesFilter,
  parseFacilityCategoriesFilter,
  parseFacilitiesTab
} from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const FacilitiesPage = async ({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const initial_tab = parseFacilitiesTab(search_params)
  const initialFacilitiesFilter = parseFacilitiesFilter(search_params)
  const initialCategoriesFilter = parseFacilityCategoriesFilter(search_params)

  const initial_facilities_data = facilityService.get_default_response(initialFacilitiesFilter)
  const initial_categories_data = facilityService.get_default_category_response(initialCategoriesFilter)

  return (
    <AuthorizedLayout requiredPath="/facilities/facilities" params={{ locale }}>
      {() => (
        <FacilitiesManagementContent
          dictionary={dictionary}
          session={session}
          locale={locale}
          initial_tab={initial_tab}
          initial_facilities_filter={{
            ...initialFacilitiesFilter,
            page_index: initial_facilities_data.page_index,
            page_size: initial_facilities_data.page_size
          }}
          initial_facilities_data={initial_facilities_data}
          initial_facilities_loaded={false}
          initial_categories_filter={{
            ...initialCategoriesFilter,
            page_index: initial_categories_data.page_index,
            page_size: initial_categories_data.page_size
          }}
          initial_categories_data={initial_categories_data}
          initial_categories_loaded={false}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FacilitiesPage
