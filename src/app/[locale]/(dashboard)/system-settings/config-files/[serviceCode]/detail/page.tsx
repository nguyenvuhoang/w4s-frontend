import { Box } from '@mui/material'
import { notFound } from 'next/navigation'

import type { Locale } from '@/configs/i18n'
import StaticConfigFileDetailContent from '@/features/system-settings/config-files/components/StaticConfigFileDetailContent'
import { getConfigFileServiceModule, localizeConfigFileServiceModule } from '@/features/system-settings/config-files/services/configFileServices'
import { getDictionary } from '@/shared/utils/getDictionary'

type ServiceConfigFileDetailPageProps = {
  params: Promise<{
    locale: string
    serviceCode: string
  }>
  searchParams: Promise<{
    relative_path?: string
  }>
}

const ServiceConfigFileDetailPage = async ({ params, searchParams }: ServiceConfigFileDetailPageProps) => {
  const { locale, serviceCode } = await params
  const { relative_path } = await searchParams
  const language = locale as Locale
  const module = getConfigFileServiceModule(serviceCode)

  if (!module) {
    notFound()
  }

  const dictionary = await getDictionary(language)
  const localizedModule = localizeConfigFileServiceModule(module, dictionary)

  return (
    <Box sx={{ p: 6 }}>
      <StaticConfigFileDetailContent
        dictionary={dictionary}
        locale={language}
        serviceCode={module.key}
        serviceDisplayCode={module.code}
        serviceName={localizedModule.name}
        relativePath={relative_path ?? ''}
      />
    </Box>
  )
}

export default ServiceConfigFileDetailPage
