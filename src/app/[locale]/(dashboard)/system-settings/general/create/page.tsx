import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import SystemCodeCreateContent from '@/features/system-settings/system-codes/components/SystemCodeCreateContent'
import { getDictionary } from '@/shared/utils/getDictionary'

const SystemCodeCreatePage = async ({ params }: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return <Box sx={{ p: 6 }}><SystemCodeCreateContent dictionary={dictionary} locale={locale} /></Box>
}

export default SystemCodeCreatePage
