import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { feeService, FEE_PROJECTS_SEARCH_WORKFLOW_ID } from '@/features/fees/service'
import type { FeeProjectOption } from '@/features/fees/types'
import ProjectFeePoliciesContent from '@/features/system-settings/fee-management/components/ProjectFeePoliciesContent'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

type ProjectFeePoliciesPageProps = {
  params: Promise<{
    locale: string
  }>
}

const ProjectFeePoliciesPage = async ({ params }: ProjectFeePoliciesPageProps) => {
  const { locale } = await params
  const language = locale as Locale
  const dictionary = await getDictionary(language)
  let projects: FeeProjectOption[] = []
  let initialError: WorkflowErrorDetail | null = null

  try {
    projects = await feeService.simpleSearchProjects({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language
    })
  } catch (error) {
    initialError = normalizeWorkflowErrorDetail(error, {
      fallback: 'Unable to load projects.',
      workflowId: FEE_PROJECTS_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load projects', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <ProjectFeePoliciesContent dictionary={dictionary} locale={locale} projects={projects} initialError={initialError} />
    </Box>
  )
}

export default ProjectFeePoliciesPage
