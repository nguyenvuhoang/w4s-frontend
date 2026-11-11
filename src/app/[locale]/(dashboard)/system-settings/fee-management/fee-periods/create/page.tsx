import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { FEE_PROJECTS_SEARCH_WORKFLOW_ID, feeService } from '@/features/fees/service'
import type { FeeProjectOption } from '@/features/fees/types'
import FeePeriodFormContent from '@/features/system-settings/fee-management/components/FeePeriodFormContent'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

type FeePeriodCreatePageProps = {
  params: Promise<{
    locale: string
  }>
}

export const dynamic = 'force-dynamic'

const FeePeriodCreatePage = async ({ params }: FeePeriodCreatePageProps) => {
  const { locale } = await params
  const language = locale as Locale
  const [dictionary, session, serverToken] = await Promise.all([getDictionary(language), auth(), getServerBackendToken()])
  let projects: FeeProjectOption[] = []
  let projectsError: WorkflowErrorDetail | null = null

  try {
    projects = await feeService.simpleSearchProjects({ sessiontoken: serverToken ?? undefined, language })
  } catch (error) {
    projectsError = normalizeWorkflowErrorDetail(error, {
      fallback: dictionary.fee_settings?.projects_load_failed ?? 'Unable to load projects.',
      workflowId: FEE_PROJECTS_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load projects for fee period create', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <FeePeriodFormContent
        dictionary={dictionary}
        locale={locale}
        session={session}
        mode='create'
        projects={projects}
        projectsError={projectsError}
      />
    </Box>
  )
}

export default FeePeriodCreatePage
