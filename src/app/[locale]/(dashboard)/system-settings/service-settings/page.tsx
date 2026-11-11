import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import ServiceSettingsContent from '@/features/system-settings/service-settings/components/ServiceSettingsContent'
import { getDictionary } from '@/shared/utils/getDictionary'

type ServiceSettingsPageProps = { params: Promise<{ locale: string }> }

const ServiceSettingsPage = async ({ params }: ServiceSettingsPageProps) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale as Locale)

  return <Box sx={{ p: 6 }}><ServiceSettingsContent dictionary={dictionary} /></Box>
}

export default ServiceSettingsPage
