import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import ArticleRounded from '@mui/icons-material/ArticleRounded'
import HubRounded from '@mui/icons-material/HubRounded'
import IntegrationInstructionsRounded from '@mui/icons-material/IntegrationInstructionsRounded'
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded'
import SettingsEthernetRounded from '@mui/icons-material/SettingsEthernetRounded'
import StorageRounded from '@mui/icons-material/StorageRounded'
import type { SvgIconComponent } from '@mui/icons-material'

import type { ConfigFilesDictionary } from '../types'
import { configFileText } from '../components/configFileHelpers'

import { CONFIG_FILE_SERVICE_DEFINITIONS, type ConfigFileServiceDefinition } from './configFileServiceRegistry'

export { CONFIG_FILE_SERVICE_CODES } from './configFileServiceRegistry'
export type { ConfigFileServiceStatus } from './configFileServiceRegistry'

export type ConfigFileServiceModule = ConfigFileServiceDefinition & { icon: SvgIconComponent }

export type LocalizedConfigFileServiceModule = ConfigFileServiceModule & {
  name: string
  description: string
  action: string
  statusLabel: string
}

const icons: Record<string, SvgIconComponent> = {
  wfo: AccountTreeRounded,
  log: ArticleRounded,
  cms: StorageRounded,
  cth: HubRounded,
  ips: IntegrationInstructionsRounded,
  nch: NotificationsActiveRounded,
  dts: AccountBalanceRounded,
  dwh: SettingsEthernetRounded
}

export const CONFIG_FILE_SERVICES: ConfigFileServiceModule[] = CONFIG_FILE_SERVICE_DEFINITIONS.map(service => ({
  ...service,
  icon: icons[service.key]
}))

export const getConfigFileServiceModule = (serviceCode: string) =>
  CONFIG_FILE_SERVICES.find(module => module.key === serviceCode.toLowerCase())

export const localizeConfigFileServiceModule = (
  module: ConfigFileServiceModule,
  dictionary: ConfigFilesDictionary
): LocalizedConfigFileServiceModule => ({
  ...module,
  name: configFileText(dictionary, `${module.textKey}_name`, module.code),
  description: configFileText(dictionary, `${module.textKey}_description`, ''),
  action: configFileText(dictionary, 'config_files_service_manage_action', 'Manage configuration'),
  statusLabel: module.status === 'coming-soon'
    ? configFileText(dictionary, 'status_coming_soon', 'Coming soon')
    : configFileText(dictionary, 'status_available', 'Available')
})
