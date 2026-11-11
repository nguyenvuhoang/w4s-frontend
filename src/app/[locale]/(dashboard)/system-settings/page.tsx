import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { getDictionary } from '@/shared/utils/getDictionary'
import SystemSettingsHub from '@/views/pages/system-settings/SystemSettingsHub'

type SystemSettingsPageProps = {
  params: Promise<{
    locale: string
  }>
}

const SystemSettingsPage = async ({ params }: SystemSettingsPageProps) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale as Locale)

  return (
    <Box sx={{ p: 6 }}>
      <SystemSettingsHub dictionary={dictionary} />
    </Box>
  )
}

export default SystemSettingsPage
