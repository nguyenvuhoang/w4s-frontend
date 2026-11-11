import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import WorkflowDesignerContent from '@/features/system-settings/workflows/components/WorkflowDesignerContent'
import { getDictionary } from '@/shared/utils/getDictionary'

const WorkflowDesignerPage = async ({ params }: { params: Promise<{ locale: Locale; workflowId: string }> }) => {
  const { locale, workflowId } = await params
  const dictionary = await getDictionary(locale)

  return <Box sx={{ p: 6 }}><WorkflowDesignerContent dictionary={dictionary} locale={locale} workflowId={workflowId} /></Box>
}

export default WorkflowDesignerPage
