import 'server-only'

import type { Locale } from '@/configs/i18n'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

import { FEE_TEMPLATE_GROUP } from './feeTemplate.constants'
import { FEE_TEMPLATE_DETAIL_WORKFLOW_ID, feeTemplateService, type FeeTemplateItem } from './feeTemplate.service'

export type FeeTemplatePageData = {
  template: FeeTemplateItem | null
  notFound: boolean
  error: WorkflowErrorDetail | null
}

/** Template of the detail / edit / clone pages (WF_BO_GET_NOTIFICATION_TEMPLATE_BY_ID). */
export const loadFeeTemplatePageData = async (rawId: string, language: Locale): Promise<FeeTemplatePageData> => {
  const id = Number(rawId)

  if (!Number.isInteger(id) || id <= 0) return { template: null, notFound: true, error: null }

  try {
    const template = await feeTemplateService.getById({ sessiontoken: (await getServerBackendToken()) ?? undefined, language, id })

    // This route belongs to Fee Management only. Do not expose templates from other notification
    // groups through a guessed detail/edit/clone URL.
    const isFeeTemplate = template?.template_group === FEE_TEMPLATE_GROUP

    return { template: isFeeTemplate ? template : null, notFound: !isFeeTemplate, error: null }
  } catch (loadError) {
    logger.error('[fee-settings] Unable to load notification template', loadError)

    const error = normalizeWorkflowErrorDetail(loadError, {
      fallback: 'Unable to load the notification template.',
      workflowId: FEE_TEMPLATE_DETAIL_WORKFLOW_ID
    })

    // The backend not-found code is unknown yet (the workflow answers system.error): only an
    // explicit "notfound" error code is treated as not found, anything else is shown as an error.
    return /notfound|not_found/i.test(error.errorCode ?? '')
      ? { template: null, notFound: true, error: null }
      : { template: null, notFound: false, error }
  }
}
