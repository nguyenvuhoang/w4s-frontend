import type { Locale } from '@/configs/i18n'
import { configFileText } from '@/features/system-settings/config-files/components/configFileHelpers'
import { CONFIG_FILE_SERVICE_DEFINITIONS } from '@/features/system-settings/config-files/services/configFileServiceRegistry'
import DataMigrationContent from '@/features/system-settings/data-migration/DataMigrationContent'
import { getDictionary } from '@/shared/utils/getDictionary'

const DataMigrationPage = async ({ params }: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)
  const services = CONFIG_FILE_SERVICE_DEFINITIONS.filter(service => service.status === 'available')
    .map(({ key, code, textKey }) => ({
      key,
      code,
      name: configFileText(dictionary, `${textKey}_name`, code)
    }))
  const configuredEnvironment = process.env.NEXT_PUBLIC_APP_ENV?.trim().toUpperCase()
  const environment = configuredEnvironment && ['DEV', 'UAT', 'PROD'].includes(configuredEnvironment)
    ? configuredEnvironment
    : undefined

  return <DataMigrationContent locale={locale} environment={environment} services={services} labels={dictionary.data_migration} />
}

export default DataMigrationPage
