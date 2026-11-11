import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'

export const displayBankHubValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return '-'

  const text = String(value).trim()

  return text ? text : '-'
}

const normalizeStatus = (status: string) => status.trim().toUpperCase()

export const isBankHubCompanyActiveStatus = (status: string) => ['ACTIVE', 'A'].includes(normalizeStatus(status))

export const getBankHubCompanyStatusLabel = (dictionary: SystemSettingsDictionary, status: string) => {
  const normalized = normalizeStatus(status)

  if (normalized === 'ACTIVE' || normalized === 'A') return integrationsText(dictionary, 'bankhub_companies_status_active')
  if (normalized === 'INACTIVE' || normalized === 'I') return integrationsText(dictionary, 'bankhub_companies_status_inactive')

  return displayBankHubValue(status)
}

export const getBankHubCompanyActiveLabel = (dictionary: SystemSettingsDictionary, isActive: boolean) => (
  integrationsText(dictionary, isActive ? 'bankhub_companies_active_yes' : 'bankhub_companies_active_no')
)
