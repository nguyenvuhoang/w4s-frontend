import type { SvgIconComponent } from '@mui/icons-material'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CategoryRounded from '@mui/icons-material/CategoryRounded'
import MarkEmailReadRounded from '@mui/icons-material/MarkEmailReadRounded'

import type {
  LocalizedSystemSettingsModule,
  SystemSettingsDictionary,
  SystemSettingsModuleStatus
} from '@/views/pages/system-settings/systemSettingsModules'

export const FEE_SETTINGS_BASE_PATH = '/system-settings/fee-management'

export type FeeSettingsModuleKey = 'fee-types' | 'fee-periods' | 'fee-templates' | 'project-policies'

export type FeeSettingsModule = {
  key: FeeSettingsModuleKey
  textKey: string
  icon: SvgIconComponent
  /** `coming-soon` = UI ready, saving still waits for a backend workflow (badge shown on the card). */
  status: SystemSettingsModuleStatus
}

/** Texts live under `fee_settings` in the dictionaries; the English fallback keeps `la` readable. */
export const feeSettingsText = (dictionary: SystemSettingsDictionary, key: string, fallback: string) => (
  dictionary.fee_settings?.[key] ?? fallback
)

export const feeSettingsHref = (locale: string, suffix = '') => `/${locale}${FEE_SETTINGS_BASE_PATH}${suffix}`

export const feeSettingsModules: FeeSettingsModule[] = [
  { key: 'fee-types', textKey: 'module_fee_types', icon: CategoryRounded, status: 'available' },
  { key: 'fee-periods', textKey: 'module_fee_periods', icon: CalendarMonthRounded, status: 'available' },
  { key: 'fee-templates', textKey: 'module_fee_templates', icon: MarkEmailReadRounded, status: 'available' }
]

const moduleFallbacks: Record<FeeSettingsModuleKey, { title: string; description: string }> = {
  'fee-types': {
    title: 'Fee types',
    description: 'System-wide fee type catalog: code, name, calculation method, unit and default amount.'
  },
  'fee-periods': {
    title: 'Fee periods',
    description: 'System-wide billing periods by year and month, with quick generation of a whole year.'
  },
  'fee-templates': {
    title: 'Fee notification templates',
    description: 'Email and App notification templates with dynamic data variables and cloning.'
  },
  'project-policies': {
    title: 'Project fee policies',
    description: 'Per-project debt handling: accumulate debt or manage each period separately.'
  }
}

export const findFeeSettingsModule = (key: FeeSettingsModuleKey) => feeSettingsModules.find(module => module.key === key)!

/**
 * Shapes a fee settings module as a System Settings module so the hub can render it with the shared
 * `SystemSettingCard` (identical size, spacing, hover and badge to the main settings hub).
 */
export const localizeFeeSettingsModule = (
  module: FeeSettingsModule,
  dictionary: SystemSettingsDictionary
): LocalizedSystemSettingsModule => ({
  key: module.key,
  textKey: module.textKey,
  href: `${FEE_SETTINGS_BASE_PATH}/${module.key}`,
  status: module.status,
  icon: module.icon,
  group: 'workflow-integration',
  title: feeSettingsText(dictionary, `${module.textKey}_title`, moduleFallbacks[module.key].title),
  description: feeSettingsText(dictionary, `${module.textKey}_description`, moduleFallbacks[module.key].description),
  action: feeSettingsText(dictionary, 'module_action', 'Configure'),
  statusLabel: feeSettingsText(dictionary, 'status_backend_pending', 'Awaiting backend')
})
