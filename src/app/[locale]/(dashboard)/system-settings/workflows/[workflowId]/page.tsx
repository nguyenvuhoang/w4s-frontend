import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import WorkflowDetailContent from '@/features/system-settings/workflows/components/WorkflowDetailContent'
import { getDictionary } from '@/shared/utils/getDictionary'

const WorkflowDetailPage = async ({ params }: { params: Promise<{ locale: Locale; workflowId: string }> }) => {
  const { locale, workflowId } = await params
  const dictionary = await getDictionary(locale)

  return (
    <Box sx={{ p: 6 }}>
      <WorkflowDetailContent dictionary={dictionary} locale={locale} workflowId={workflowId} />
    </Box>
  )
}

export default WorkflowDetailPage
