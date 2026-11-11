import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Stack } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import WorkflowsContent from '@/features/system-settings/workflows/components/WorkflowsContent'
import { getDictionary } from '@/shared/utils/getDictionary'

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const pageText = (dictionary: Awaited<ReturnType<typeof getDictionary>>, key: string) => (
  dictionary.system_settings_modules?.[key] ?? key
)

const WorkflowsPage = async ({ params }: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <Box sx={{ p: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Button href={`/${locale}/system-settings`} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
            {pageText(dictionary, 'breadcrumb_system_settings')}
          </Button>
        </Box>

        <WorkflowsContent dictionary={dictionary} locale={locale} />
      </Stack>
    </Box>
  )
}

export default WorkflowsPage
