import { auth } from '@/auth'
import { i18n, Locale } from '@/configs/i18n'
import BannerManagementPage from '@/features/banners/BannerManagementPage'
import { bannerService } from '@/features/banners/service'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

import { parseBannerFilter, type SearchParams } from '../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
}>

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const BannerListPage = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseBannerFilter(search_params)
  let initialData = bannerService.getDefaultBannerResponse(initialFilter)
  let initialError: { message: string; executionId?: string } | null = null

  try {
    initialData = await bannerService.simpleSearchBanners({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    const detail = normalizeWorkflowErrorDetail(error, {
      fallback: 'Unable to load banners.'
    })

    initialError = {
      message: detail.message,
      executionId: detail.executionId
    }

    logger.error('[banner-list] Unable to load initial data', error)
  }

  return (
    <AuthorizedLayout requiredPath="/banner-list" params={{ locale }}>
      {() => (
        <BannerManagementPage
          dictionary={dictionary}
          session={session}
          locale={locale}
          initialFilter={{
            ...initialFilter,
            page_index: initialData.page_index,
            page_size: initialData.page_size
          }}
          initialData={initialData}
          initialError={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default BannerListPage
