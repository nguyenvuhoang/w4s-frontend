import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

import { assertWorkflowSuccess, pickDataRoot } from '../../propertyAggregateService'
import {
  mapNotificationTemplateParameters,
  mapProjectNotificationTemplates
} from './projectNotificationTemplateHelpers'
import {
  NOTIFICATION_TEMPLATE_PARAMETERS_WORKFLOW_ID,
  PROJECT_NOTIFICATION_TEMPLATE_GROUP,
  PROJECT_NOTIFICATION_TEMPLATE_RESET_WORKFLOW_ID,
  PROJECT_NOTIFICATION_TEMPLATE_SAVE_WORKFLOW_ID,
  PROJECT_NOTIFICATION_TEMPLATES_WORKFLOW_ID,
  type NotificationTemplateParameter,
  type ProjectNotificationTemplate,
  type ProjectNotificationTemplateResetPayload,
  type ProjectNotificationTemplateSavePayload
} from './projectNotificationTemplateTypes'

type Session = { sessiontoken?: string; language?: Locale }

/**
 * Admin (System Settings) workflows: the project is always `fields.project_id` from the detail route, never the
 * working project. The empty per-request override replaces the working-project `scope` the HTTP client adds, so
 * the header is not sent (same override as WF_BO_GET_BO_CONTEXT); the authentication headers are unchanged.
 */
const ADMIN_WORKFLOW_SCOPE = ''

const requireSession = (sessiontoken?: string): string => {
  if (!sessiontoken) throw new Error('Session is required.')

  return sessiontoken
}

export const projectNotificationTemplateService = {
  /** WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES: global templates merged with the overrides of the project. */
  async list_templates({
    sessiontoken,
    language,
    project_id,
    template_group = PROJECT_NOTIFICATION_TEMPLATE_GROUP
  }: Session & { project_id: number; template_group?: string }): Promise<ProjectNotificationTemplate[]> {
    const response = await workflowService.runFODynamic({
      sessiontoken: requireSession(sessiontoken),
      workflowid: PROJECT_NOTIFICATION_TEMPLATES_WORKFLOW_ID,
      input: { project_id, template_group },
      language,
      scope: ADMIN_WORKFLOW_SCOPE
    })

    assertWorkflowSuccess(response, 'Unable to load notification templates.', language)

    return mapProjectNotificationTemplates(pickDataRoot(response))
  },

  /** WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS: placeholders of the group, with their sample values. */
  async list_parameters({
    sessiontoken,
    language,
    template_group = PROJECT_NOTIFICATION_TEMPLATE_GROUP
  }: Session & { template_group?: string }): Promise<NotificationTemplateParameter[]> {
    const response = await workflowService.runFODynamic({
      sessiontoken: requireSession(sessiontoken),
      workflowid: NOTIFICATION_TEMPLATE_PARAMETERS_WORKFLOW_ID,
      input: { template_group },
      language,
      scope: ADMIN_WORKFLOW_SCOPE
    })

    assertWorkflowSuccess(response, 'Unable to load template parameters.', language)

    return mapNotificationTemplateParameters(pickDataRoot(response))
  },

  /** WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE (payload built by buildTemplateSavePayload). */
  async save_template({ sessiontoken, language, payload }: Session & { payload: ProjectNotificationTemplateSavePayload }) {
    const response = await workflowService.runFODynamic({
      sessiontoken: requireSession(sessiontoken),
      workflowid: PROJECT_NOTIFICATION_TEMPLATE_SAVE_WORKFLOW_ID,
      input: payload,
      language,
      scope: ADMIN_WORKFLOW_SCOPE
    })

    assertWorkflowSuccess(response, 'Unable to save the notification template.', language)

    return response
  },

  /** WF_BO_RESET_PROJECT_NOTIFICATION_TEMPLATE { project_id, template_code }. */
  async reset_template({ sessiontoken, language, payload }: Session & { payload: ProjectNotificationTemplateResetPayload }) {
    const response = await workflowService.runFODynamic({
      sessiontoken: requireSession(sessiontoken),
      workflowid: PROJECT_NOTIFICATION_TEMPLATE_RESET_WORKFLOW_ID,
      input: payload,
      language,
      scope: ADMIN_WORKFLOW_SCOPE
    })

    assertWorkflowSuccess(response, 'Unable to restore the default notification template.', language)

    return response
  }
}
