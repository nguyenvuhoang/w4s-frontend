import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import ConfigFileServiceListContent from '@/features/system-settings/config-files/components/ConfigFileServiceListContent'
import { getDictionary } from '@/shared/utils/getDictionary'

type ConfigFilesPageProps = {
  params: Promise<{
    locale: string
  }>
}

const ConfigFilesPage = async ({ params }: ConfigFilesPageProps) => {
  const { locale } = await params
  const language = locale as Locale
  const dictionary = await getDictionary(language)

  return (
    <Box sx={{ p: 6 }}>
      <ConfigFileServiceListContent dictionary={dictionary} locale={language} />
    </Box>
  )
}

export default ConfigFilesPage
