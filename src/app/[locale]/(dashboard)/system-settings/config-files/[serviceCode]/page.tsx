import { Box } from '@mui/material'
import { notFound } from 'next/navigation'

import type { Locale } from '@/configs/i18n'
import StaticConfigFileListContent from '@/features/system-settings/config-files/components/StaticConfigFileListContent'
import { getConfigFileServiceModule, localizeConfigFileServiceModule } from '@/features/system-settings/config-files/services/configFileServices'
import { getDictionary } from '@/shared/utils/getDictionary'

type ServiceConfigFilesPageProps = {
  params: Promise<{
    locale: string
    serviceCode: string
  }>
}

const ServiceConfigFilesPage = async ({ params }: ServiceConfigFilesPageProps) => {
  const { locale, serviceCode } = await params
  const language = locale as Locale
  const module = getConfigFileServiceModule(serviceCode)

  if (!module) {
    notFound()
  }

  const dictionary = await getDictionary(language)
  const localizedModule = localizeConfigFileServiceModule(module, dictionary)

  return (
    <Box sx={{ p: 6 }}>
      <StaticConfigFileListContent
        dictionary={dictionary}
        locale={language}
        serviceCode={module.key}
        serviceDisplayCode={module.code}
        serviceName={localizedModule.name}
      />
    </Box>
  )
}

export default ServiceConfigFilesPage
