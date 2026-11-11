import type { Locale } from '@/configs/i18n'

export const getWorkflowDesignerRoute = (locale: Locale, workflowId: string) => (
  `/${locale}/system-settings/workflows/${encodeURIComponent(workflowId)}/designer`
)
