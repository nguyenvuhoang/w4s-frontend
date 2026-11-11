export const PROJECT_NOTIFICATION_TEMPLATE_GROUP = 'FEE'

export const PROJECT_NOTIFICATION_TEMPLATES_WORKFLOW_ID = 'WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES'
export const NOTIFICATION_TEMPLATE_PARAMETERS_WORKFLOW_ID = 'WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS'
export const PROJECT_NOTIFICATION_TEMPLATE_SAVE_WORKFLOW_ID = 'WF_BO_SAVE_PROJECT_NOTIFICATION_TEMPLATE'
export const PROJECT_NOTIFICATION_TEMPLATE_RESET_WORKFLOW_ID = 'WF_BO_RESET_PROJECT_NOTIFICATION_TEMPLATE'

/** Values confirmed by the integration contract; any other value returned by the backend is kept as-is. */
export const KNOWN_TEMPLATE_CHANNELS = ['ALL'] as const

/**
 * The backend stores the IPS status code (IPSStatus.Active = 'A'), not the 'Active' of the integration document.
 * The editor keeps the value returned by the list and only offers the confirmed active code.
 */
export const TEMPLATE_STATUS_ACTIVE = 'A'
export const KNOWN_TEMPLATE_STATUSES = [TEMPLATE_STATUS_ACTIVE] as const

/** One row of WF_BO_GET_PROJECT_NOTIFICATION_TEMPLATES (global template or project override). */
export type ProjectNotificationTemplate = {
  id: number | null
  project_id: number | null
  template_code: string
  template_name: string
  template_group: string
  channel: string
  subject: string
  body_html: string
  is_default: boolean
  status: string
  /** Authoritative flag: true = project override, false = global system template. */
  is_customized: boolean
  global_template_id: number | null
}

/** One placeholder of WF_BO_GET_NOTIFICATION_TEMPLATE_PARAMETERS. */
export type NotificationTemplateParameter = {
  placeholder: string
  description: string
  sample_value: string
  aliases: string[]
}

/** Editable fields of the template editor. */
export type ProjectNotificationTemplateForm = {
  template_code: string
  template_name: string
  template_group: string
  channel: string
  subject: string
  body_html: string
  is_default: boolean
  status: string
}

export type ProjectNotificationTemplateFormErrors = Partial<Record<'template_name' | 'subject' | 'body_html', string>>

export type ProjectNotificationTemplateSavePayload = ProjectNotificationTemplateForm & {
  project_id: number
  id: number | null
}

export type ProjectNotificationTemplateResetPayload = {
  project_id: number
  template_code: string
}
