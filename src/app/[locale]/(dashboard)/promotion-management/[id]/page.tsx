import { Locale } from '@/configs/i18n'
import PromotionDetailPage from '@/features/promotions/PromotionDetailPage'
import { promotionService } from '@/features/promotions/service'
import type { PromotionItem } from '@/features/promotions/types'
import { WorkflowError } from '@/shared/utils/workflowError'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'
import { getDictionary } from '@utils/getDictionary'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'

import type { SearchParams } from '../../pageRouteHelpers'
import { getSearchValue } from '../../pageRouteHelpers'
import logger from '@lib/logger'

type Params = Promise<{
  locale: Locale
  id: string
}>

const PromotionDetailRoute = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale, id } = await params
  const search_params = await searchParams ?? {}
  const dictionary = await getDictionary(locale)
  const promotionId = id
  const projectIdParam = Number(getSearchValue(search_params, 'project_id'))
  const projectId = Number.isInteger(projectIdParam) && projectIdParam > 0 ? projectIdParam : null
  let promotion: PromotionItem | null = null
  let initialError: { message: string; executionId?: string } | null = null

  if (projectId) {
    try {
      promotion = await promotionService.getPromotionById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        projectId,
        id: promotionId
      })
    } catch (error) {
      initialError = error instanceof WorkflowError
        ? { message: error.message, executionId: error.execution_id || undefined }
        : { message: error instanceof Error ? error.message : 'Unable to load promotion detail.' }
      logger.error('[promotion-management] Unable to load detail', error)
    }
  }

  return (
    <AuthorizedLayout requiredPath="/promotion-management" params={{ locale }}>
      {() => (
        <PromotionDetailPage
          dictionary={dictionary}
          locale={locale}
          id={promotionId}
          promotion={promotion}
          error={initialError}
        />
      )}
    </AuthorizedLayout>
  )
}

export default PromotionDetailRoute
