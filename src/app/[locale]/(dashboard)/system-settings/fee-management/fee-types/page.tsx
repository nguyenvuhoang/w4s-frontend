import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeManagementPage from '@/features/fees/FeeManagementPage'
import { SETTINGS_FEE_TYPE_ROUTES } from '@/features/fees/feeTypeRoutes'
import { feeService } from '@/features/fees/service'
import type { FeeWorkflowError } from '@/features/fees/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import { getDictionary } from '@utils/getDictionary'
import logger from '@lib/logger'

import { parseFeeTypeFilter, type SearchParams } from '../../../pageRouteHelpers'

type Params = Promise<{
  locale: Locale
}>

/**
 * Fee types inside System Settings > Fee Management. Reuses the fee type feature screens with the
 * settings route config; access is enforced by the System Settings layout (Super Admin boundary).
 */
const SettingsFeeTypesPage = async ({ params, searchParams }: { params: Params; searchParams?: Promise<SearchParams> }) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseFeeTypeFilter(search_params)
  let initialData = feeService.getDefaultFeeTypeResponse(initialFilter)
  let initialError: FeeWorkflowError | null = null

  try {
    initialData = await feeService.simpleSearchFeeTypes({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    initialError = normalizeWorkflowErrorDetail(error, {
      fallback: 'Unable to load fee types.'
    })
    logger.error('[fee-settings] Unable to load fee types', error)
  }

  return (
    <FeeManagementPage
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
      routes={SETTINGS_FEE_TYPE_ROUTES}
    />
  )
}

export default SettingsFeeTypesPage
