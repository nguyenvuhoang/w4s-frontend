import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import FeeTemplatesContent from '@/features/system-settings/fee-management/components/FeeTemplatesContent'
import {
  emptyFeeTemplateFilter,
  FEE_TEMPLATE_SEARCH_WORKFLOW_ID,
  feeTemplateService,
  type FeeTemplateSearchResult
} from '@/features/system-settings/fee-management/feeTemplate.service'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

type FeeTemplatesPageProps = {
  params: Promise<{
    locale: string
  }>
}

export const dynamic = 'force-dynamic'

const FeeTemplatesPage = async ({ params }: FeeTemplatesPageProps) => {
  const { locale } = await params
  const language = locale as Locale
  const [dictionary, session, serverToken] = await Promise.all([getDictionary(language), auth(), getServerBackendToken()])
  const initialFilter = emptyFeeTemplateFilter
  let initialData: FeeTemplateSearchResult = { items: [], total_count: 0, page_index: 1, page_size: initialFilter.page_size }
  let initialError: WorkflowErrorDetail | null = null

  try {
    initialData = await feeTemplateService.search({ sessiontoken: serverToken ?? undefined, language, filter: initialFilter })
  } catch (error) {
    initialError = normalizeWorkflowErrorDetail(error, {
      fallback: dictionary.fee_settings?.template_load_failed ?? 'Unable to load templates.',
      workflowId: FEE_TEMPLATE_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load notification templates', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <FeeTemplatesContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        initialFilter={initialFilter}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default FeeTemplatesPage
