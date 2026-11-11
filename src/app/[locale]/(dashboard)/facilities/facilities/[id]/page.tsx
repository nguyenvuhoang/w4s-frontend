import { auth } from '@/auth'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import FacilityDetailPage from '@/features/facilities/components/FacilityDetailPage'
import { facilityService } from '@/features/facilities/services/facilityService'
import type { FacilityCategoryItem, FacilityItem } from '@/features/facilities/types'
import { getDictionary } from '@utils/getDictionary'
import { i18n, Locale } from '@/configs/i18n'
import { toClientSessionToken } from '@utils/safeSessionToken'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

type DetailSearchParams = {
  project_id?: string
  code?: string
}

const FacilityDetailRoute = async ({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale; id: string }>
  searchParams?: Promise<DetailSearchParams>
}) => {
  const { locale, id } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  const facility_id = Number(id)
  const project_id = Number(search_params.project_id) || 1

  let facility: FacilityItem | null = null
  let category_options: FacilityCategoryItem[] = []
  let load_error: string | null = null

  try {
    const search_response = await facilityService.simpleSearchFacilities({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: {
        search_text: search_params.code ?? '',
        project_id,
        page_index: 1,
        page_size: 50
      }
    })

    facility = search_response.items.find(item => item.id === facility_id) ?? null

    const categories_response = await facilityService.simpleSearchFacilityCategories({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: {
        search_text: '',
        project_id,
        page_index: 1,
        page_size: 200
      }
    })

    category_options = categories_response.items
  } catch (error) {
    load_error = error instanceof Error ? error.message : null
    logger.error('[facilities] Unable to load facility detail', error)
  }

  return (
    <AuthorizedLayout requiredPath="/facilities/facilities" params={{ locale }}>
      {() => (
        <FacilityDetailPage
          dictionary={dictionary}
          locale={locale}
          sessiontoken={toClientSessionToken(session) ?? ''}
          facility={facility}
          category_options={category_options}
          error={load_error}
        />
      )}
    </AuthorizedLayout>
  )
}

export default FacilityDetailRoute
