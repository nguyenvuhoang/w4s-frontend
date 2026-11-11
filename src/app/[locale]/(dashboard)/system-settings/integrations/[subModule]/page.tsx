import { notFound } from 'next/navigation'
import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import {
  findIntegrationModule,
  localizeIntegrationModule
} from '@/features/system-settings/integrations/integrationModules'
import IntegrationModulePlaceholder from '@/features/system-settings/integrations/components/IntegrationModulePlaceholder'
import { getDictionary } from '@/shared/utils/getDictionary'

type IntegrationModulePageProps = {
  params: Promise<{
    locale: string
    subModule: string
  }>
}

const IntegrationModulePage = async ({ params }: IntegrationModulePageProps) => {
  const { locale, subModule } = await params
  const integrationModule = findIntegrationModule(subModule)

  if (!integrationModule) {
    notFound()
  }

  const dictionary = await getDictionary(locale as Locale)
  const localizedModule = localizeIntegrationModule(integrationModule, dictionary)

  return (
    <Box sx={{ p: 6 }}>
      <IntegrationModulePlaceholder
        dictionary={dictionary}
        locale={locale}
        title={localizedModule.title}
        description={localizedModule.description}
        icon={localizedModule.icon}
      />
    </Box>
  )
}

export default IntegrationModulePage
