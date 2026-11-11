import { auth } from '@/auth'
import { i18n, Locale } from '@/configs/i18n'
import PromotionManagementPage from '@/features/promotions/PromotionManagementPage'
import { promotionService } from '@/features/promotions/service'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'

import { parsePromotionFilter, type SearchParams } from '../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
}>

export async function generateStaticParams() {
  return i18n.locales.map((l) => ({ locale: l }))
}

const PromotionManagementRoute = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parsePromotionFilter(search_params)
  let initialData = promotionService.getDefaultPromotionResponse(initialFilter)
  let initialError: { message: string; executionId?: string } | null = null

  try {
    initialData = await promotionService.simpleSearchPromotions({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    const detail = normalizeWorkflowErrorDetail(error, {
      fallback: 'Unable to load promotions.'
    })

    initialError = {
      message: detail.message,
      executionId: detail.executionId
    }

    logger.error('[promotion-management] Unable to load initial data', error)
  }

  return (
    <AuthorizedLayout requiredPath="/promotion-management" params={{ locale }}>
      {() => (
        <PromotionManagementPage
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

export default PromotionManagementRoute
