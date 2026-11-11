import type { SvgIconComponent } from '@mui/icons-material'
import ApartmentRounded from '@mui/icons-material/ApartmentRounded'
import DesignServicesRounded from '@mui/icons-material/DesignServicesRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import PolicyRounded from '@mui/icons-material/PolicyRounded'
import QueryStatsRounded from '@mui/icons-material/QueryStatsRounded'
import ScienceRounded from '@mui/icons-material/ScienceRounded'
import VpnKeyRounded from '@mui/icons-material/VpnKeyRounded'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

export type IntegrationModuleKey =
  | 'api-design'
  | 'api-testing'
  | 'api-keys'
  | 'api-portal'
  | 'api-analytics'
  | 'api-governance'
  | 'bank-hub-companies'

export type IntegrationModule = {
  key: IntegrationModuleKey
  textKey: string
  icon: SvgIconComponent
  /** Overrides the default badge/action labels (dictionary keys under `system_settings_modules`). */
  statusTextKey?: string
  actionTextKey?: string
  statusColor?: 'warning' | 'info'
}

export type LocalizedIntegrationModule = IntegrationModule & {
  title: string
  description: string
  action: string
  statusLabel: string
}

export const integrationsText = (dictionary: SystemSettingsDictionary, key: string) => (
  dictionary.system_settings_modules?.[key] ?? key
)

export const localizeIntegrationModule = (
  module: IntegrationModule,
  dictionary: SystemSettingsDictionary
): LocalizedIntegrationModule => ({
  ...module,
  title: integrationsText(dictionary, `${module.textKey}_title`),
  description: integrationsText(dictionary, `${module.textKey}_description`),
  action: integrationsText(dictionary, module.actionTextKey ?? 'integrations_module_action'),
  statusLabel: integrationsText(dictionary, module.statusTextKey ?? 'status_coming_soon')
})

/**
 * Fixed display order for the Control Plane grid. Route segment for each module is its `key`,
 * resolved under `/system-settings/integrations/[subModule]`.
 */
export const integrationModules: IntegrationModule[] = [
  { key: 'api-design', textKey: 'integrations_module_api_design', icon: DesignServicesRounded },
  { key: 'api-testing', textKey: 'integrations_module_api_testing', icon: ScienceRounded },
  { key: 'api-keys', textKey: 'integrations_module_api_keys', icon: VpnKeyRounded },
  { key: 'api-portal', textKey: 'integrations_module_api_portal', icon: MenuBookRounded },
  { key: 'api-analytics', textKey: 'integrations_module_api_analytics', icon: QueryStatsRounded },
  { key: 'api-governance', textKey: 'integrations_module_api_governance', icon: PolicyRounded },
  {
    // Has its own static route (`integrations/bank-hub-companies/page.tsx`), which takes precedence over `[subModule]`.
    key: 'bank-hub-companies',
    textKey: 'integrations_module_bank_hub_companies',
    icon: ApartmentRounded,
    statusTextKey: 'integrations_bank_hub_companies_status',
    actionTextKey: 'integrations_bank_hub_companies_action',
    statusColor: 'info'
  }
]

export const findIntegrationModule = (key: string) => integrationModules.find(module => module.key === key)
