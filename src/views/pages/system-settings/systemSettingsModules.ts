import type { SvgIconComponent } from '@mui/icons-material'
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded'
import ApartmentRounded from '@mui/icons-material/ApartmentRounded'
import BackupTableRounded from '@mui/icons-material/BackupTableRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import BugReportRounded from '@mui/icons-material/BugReportRounded'
import DataObjectRounded from '@mui/icons-material/DataObjectRounded'
import GppGoodRounded from '@mui/icons-material/GppGoodRounded'
import HistoryRounded from '@mui/icons-material/HistoryRounded'
import HubRounded from '@mui/icons-material/HubRounded'
import ImageRounded from '@mui/icons-material/ImageRounded'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import NotificationsRounded from '@mui/icons-material/NotificationsRounded'
import PaletteRounded from '@mui/icons-material/PaletteRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import SchemaRounded from '@mui/icons-material/SchemaRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import TuneRounded from '@mui/icons-material/TuneRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import LocationCityRounded from '@mui/icons-material/LocationCityRounded'

import type { getDictionary } from '@/shared/utils/getDictionary'
import { DATA_MIGRATION_PATH } from '@/features/system-settings/data-migration/dataMigrationConfig'

export type SystemSettingsModuleStatus = 'available' | 'coming-soon'

export type SystemSettingsGroupKey =
  | 'users-permissions'
  | 'branding-ui'
  | 'navigation-features'
  | 'workflow-integration'
  | 'logs-monitoring'
  | 'system-maintenance'

export type SystemSettingsModule = {
  key: string
  textKey: string
  href: string
  status: SystemSettingsModuleStatus
  icon: SvgIconComponent
  group: SystemSettingsGroupKey
}

export type LocalizedSystemSettingsModule = SystemSettingsModule & {
  title: string
  description: string
  action: string
  statusLabel: string
}

export type SystemSettingsDictionary = Awaited<ReturnType<typeof getDictionary>>

const moduleText = (dictionary: SystemSettingsDictionary, key: string) => (
  dictionary.system_settings_modules?.[key] ?? key
)

export const localizeSystemSettingsModule = (
  module: SystemSettingsModule,
  dictionary: SystemSettingsDictionary
): LocalizedSystemSettingsModule => ({
  ...module,
  title: moduleText(dictionary, `${module.textKey}_title`),
  description: moduleText(dictionary, `${module.textKey}_description`),
  action: moduleText(dictionary, `${module.textKey}_action`),
  statusLabel: module.status === 'coming-soon'
    ? moduleText(dictionary, 'status_coming_soon')
    : moduleText(dictionary, 'status_available')
})

/**
 * Fixed display order for the hub's grouped grid. A module's `group` field must reference one of
 * these keys — see systemSettingsModules below.
 */
export const systemSettingsGroups: { key: SystemSettingsGroupKey; textKey: string }[] = [
  { key: 'users-permissions', textKey: 'group_users_permissions' },
  { key: 'branding-ui', textKey: 'group_branding_ui' },
  { key: 'navigation-features', textKey: 'group_navigation_features' },
  { key: 'workflow-integration', textKey: 'group_workflow_integration' },
  { key: 'logs-monitoring', textKey: 'group_logs_monitoring' },
  { key: 'system-maintenance', textKey: 'group_system_maintenance' }
]

export const localizeSystemSettingsGroupTitle = (
  group: { textKey: string },
  dictionary: SystemSettingsDictionary
): string => moduleText(dictionary, group.textKey)

export const systemSettingsModules: SystemSettingsModule[] = [
  {
    key: 'staff-management',
    textKey: 'module_staff_management',
    href: '/users/staffs',
    status: 'available',
    icon: BadgeRounded,
    group: 'users-permissions'
  },
  {
    key: 'projects',
    textKey: 'module_projects',
    href: '/system-settings/projects',
    status: 'available',
    icon: ApartmentRounded,
    group: 'users-permissions'
  },
  {
    key: 'roles-profile',
    textKey: 'module_roles_profile',
    href: '/roles-profile',
    status: 'available',
    icon: ShieldRounded,
    group: 'users-permissions'
  },
  {
    key: 'user-roles',
    textKey: 'module_user_roles',
    href: '/system-settings/user-roles',
    status: 'available',
    icon: AdminPanelSettingsRounded,
    group: 'users-permissions'
  },
  {
    key: 'fee-management',
    textKey: 'module_fee_management',
    href: '/system-settings/fee-management',
    status: 'available',
    icon: ReceiptLongRounded,
    group: 'users-permissions'
  },
  {
    key: 'branding',
    textKey: 'module_branding',
    href: '/system-settings/branding',
    status: 'available',
    icon: ImageRounded,
    group: 'branding-ui'
  },
  {
    key: 'colors-typography',
    textKey: 'module_colors_typography',
    href: '/system-settings/colors-typography',
    status: 'available',
    icon: PaletteRounded,
    group: 'branding-ui'
  },
  {
    key: 'language-dictionary',
    textKey: 'module_language_dictionary',
    href: '/system-settings/language-dictionary',
    status: 'available',
    icon: LanguageRounded,
    group: 'branding-ui'
  },
  {
    key: 'menu-management',
    textKey: 'module_menu_management',
    href: '/system-settings/menu-management',
    status: 'available',
    icon: SchemaRounded,
    group: 'navigation-features'
  },
  {
    key: 'provinces',
    textKey: 'module_provinces',
    href: '/system-settings/provinces',
    status: 'available',
    icon: LocationCityRounded,
    group: 'navigation-features'
  },
  {
    key: 'workflows',
    textKey: 'module_workflows',
    href: '/system-settings/workflows',
    status: 'available',
    icon: AccountTreeRounded,
    group: 'workflow-integration'
  },
  {
    key: 'integrations',
    textKey: 'module_integrations',
    href: '/system-settings/integrations',
    status: 'available',
    icon: HubRounded,
    group: 'workflow-integration'
  },
  {
    key: 'notifications',
    textKey: 'module_notifications',
    href: '/system-settings/notifications',
    status: 'coming-soon',
    icon: NotificationsRounded,
    group: 'workflow-integration'
  },
  {
    key: 'audit-logs',
    textKey: 'module_audit_logs',
    href: '/system-settings/audit-logs',
    status: 'available',
    icon: HistoryRounded,
    group: 'logs-monitoring'
  },
  {
    key: 'application-logs',
    textKey: 'module_application_logs',
    href: '/system-settings/application-logs',
    status: 'available',
    icon: BugReportRounded,
    group: 'logs-monitoring'
  },
  {
    key: 'general',
    textKey: 'module_general',
    href: '/system-settings/general',
    status: 'available',
    icon: SettingsRounded,
    group: 'system-maintenance'
  },
  {
    key: 'config-files',
    textKey: 'module_config_files',
    href: '/system-settings/config-files',
    status: 'available',
    icon: DataObjectRounded,
    group: 'system-maintenance'
  },
  {
    key: 'service-settings',
    textKey: 'module_service_settings',
    href: '/system-settings/service-settings',
    status: 'available',
    icon: TuneRounded,
    group: 'system-maintenance'
  },
  {
    key: 'security',
    textKey: 'module_security',
    href: '/system-settings/security',
    status: 'coming-soon',
    icon: GppGoodRounded,
    group: 'system-maintenance'
  },
  {
    key: 'data-migration',
    textKey: 'module_data_migration',
    href: DATA_MIGRATION_PATH,
    status: 'available',
    icon: SwapHorizRounded,
    group: 'system-maintenance'
  },
  {
    key: 'backup-maintenance',
    textKey: 'module_backup_maintenance',
    href: '/system-settings/backup-maintenance',
    status: 'coming-soon',
    icon: BackupTableRounded,
    group: 'system-maintenance'
  }
]
