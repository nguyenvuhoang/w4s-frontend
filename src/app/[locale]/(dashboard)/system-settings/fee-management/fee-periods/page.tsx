import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { FEE_PERIODS_SEARCH_WORKFLOW_ID, FEE_PROJECTS_SEARCH_WORKFLOW_ID, feeService } from '@/features/fees/service'
import type { FeePeriodSearchResponse, FeeProjectOption } from '@/features/fees/types'
import FeePeriodsContent from '@/features/system-settings/fee-management/components/FeePeriodsContent'
import { emptyFeePeriodFilter } from '@/features/system-settings/fee-management/feePeriod.helpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

type FeePeriodsPageProps = {
  params: Promise<{
    locale: string
  }>
}

export const dynamic = 'force-dynamic'

/**
 * System Settings manages fee periods of every project: the first page is loaded without project_id
 * (all projects) and does not follow the global working project. The project list feeds the
 * project filter and the project name column.
 */
const FeePeriodsPage = async ({ params }: FeePeriodsPageProps) => {
  const { locale } = await params
  const language = locale as Locale
  const [dictionary, session, serverToken] = await Promise.all([getDictionary(language), auth(), getServerBackendToken()])
  const sessiontoken = serverToken ?? undefined
  const initialFilter = emptyFeePeriodFilter

  const [periodsResult, projectsResult] = await Promise.allSettled([
    feeService.searchFeePeriods({ sessiontoken, language, filter: initialFilter }),
    feeService.simpleSearchProjects({ sessiontoken, language })
  ])

  let initialData: FeePeriodSearchResponse = feeService.getDefaultFeePeriodResponse(initialFilter)
  let initialError: WorkflowErrorDetail | null = null
  let projects: FeeProjectOption[] = []
  let projectsError: WorkflowErrorDetail | null = null

  if (periodsResult.status === 'fulfilled') {
    initialData = periodsResult.value
  } else {
    initialError = normalizeWorkflowErrorDetail(periodsResult.reason, {
      fallback: dictionary.fee_settings?.period_load_failed ?? 'Unable to load fee periods.',
      workflowId: FEE_PERIODS_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load fee periods', periodsResult.reason)
  }

  if (projectsResult.status === 'fulfilled') {
    projects = projectsResult.value
  } else {
    projectsError = normalizeWorkflowErrorDetail(projectsResult.reason, {
      fallback: dictionary.fee_settings?.projects_load_failed ?? 'Unable to load projects.',
      workflowId: FEE_PROJECTS_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load projects for fee periods', projectsResult.reason)
  }

  return (
    <Box sx={{ p: 6 }}>
      <FeePeriodsContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        initialFilter={initialFilter}
        initialData={initialData}
        initialError={initialError}
        projects={projects}
        projectsError={projectsError}
      />
    </Box>
  )
}

export default FeePeriodsPage
