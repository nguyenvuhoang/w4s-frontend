import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import IntegrationsHubContent from '@/features/system-settings/integrations/components/IntegrationsHubContent'
import { getDictionary } from '@/shared/utils/getDictionary'

type SystemIntegrationsPageProps = {
  params: Promise<{
    locale: string
  }>
}

const SystemIntegrationsPage = async ({ params }: SystemIntegrationsPageProps) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale as Locale)

  return (
    <Box sx={{ p: 6 }}>
      <IntegrationsHubContent dictionary={dictionary} />
    </Box>
  )
}

export default SystemIntegrationsPage
