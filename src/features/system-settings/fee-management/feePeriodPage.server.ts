import 'server-only'

import type { Locale } from '@/configs/i18n'
import { FEE_PERIOD_DETAIL_WORKFLOW_ID, FEE_PROJECTS_SEARCH_WORKFLOW_ID, feeService } from '@/features/fees/service'
import type { FeePeriodItem, FeeProjectOption } from '@/features/fees/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

import { FEE_PERIOD_NOT_FOUND_ERROR_CODE } from './feePeriod.helpers'

export type FeePeriodPageData = {
  period: FeePeriodItem | null
  notFound: boolean
  error: WorkflowErrorDetail | null
  projects: FeeProjectOption[]
  projectsError: WorkflowErrorDetail | null
}

const isNotFoundError = (detail: WorkflowErrorDetail) => (
  detail.errorCode === FEE_PERIOD_NOT_FOUND_ERROR_CODE
  || detail.message.includes(FEE_PERIOD_NOT_FOUND_ERROR_CODE)
  || (detail.errors ?? []).some(item => JSON.stringify(item).includes(FEE_PERIOD_NOT_FOUND_ERROR_CODE))
)

/** Server data of the detail / edit pages: the period (WF_BO_GET_FEE_PERIOD_BY_ID) and the project list. */
export const loadFeePeriodPageData = async (rawId: string, language: Locale): Promise<FeePeriodPageData> => {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) {
    return { period: null, notFound: true, error: null, projects: [], projectsError: null }
  }

  const sessiontoken = (await getServerBackendToken()) ?? undefined
  const [periodResult, projectsResult] = await Promise.allSettled([
    feeService.getFeePeriodById({ sessiontoken, language, id }),
    feeService.simpleSearchProjects({ sessiontoken, language })
  ])

  const data: FeePeriodPageData = { period: null, notFound: false, error: null, projects: [], projectsError: null }

  if (periodResult.status === 'fulfilled') {
    data.period = periodResult.value
    data.notFound = !periodResult.value
  } else {
    const detail = normalizeWorkflowErrorDetail(periodResult.reason, {
      fallback: 'Unable to load the fee period.',
      workflowId: FEE_PERIOD_DETAIL_WORKFLOW_ID
    })

    if (isNotFoundError(detail)) data.notFound = true
    else data.error = detail

    logger.error('[fee-settings] Unable to load fee period', periodResult.reason)
  }

  if (projectsResult.status === 'fulfilled') {
    data.projects = projectsResult.value
  } else {
    data.projectsError = normalizeWorkflowErrorDetail(projectsResult.reason, {
      fallback: 'Unable to load projects.',
      workflowId: FEE_PROJECTS_SEARCH_WORKFLOW_ID
    })
    logger.error('[fee-settings] Unable to load projects for fee period', projectsResult.reason)
  }

  return data
}
