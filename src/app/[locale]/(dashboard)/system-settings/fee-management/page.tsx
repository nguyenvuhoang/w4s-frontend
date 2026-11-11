import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import FeeSettingsHubContent from '@/features/system-settings/fee-management/components/FeeSettingsHubContent'
import { getDictionary } from '@/shared/utils/getDictionary'

type FeeSettingsPageProps = {
  params: Promise<{
    locale: string
  }>
}

const FeeSettingsPage = async ({ params }: FeeSettingsPageProps) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale as Locale)

  return (
    <Box sx={{ p: 6 }}>
      <FeeSettingsHubContent dictionary={dictionary} />
    </Box>
  )
}

export default FeeSettingsPage
