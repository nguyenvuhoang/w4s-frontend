import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'
import type { BankHubAccount } from './bankhub.types'

export const isBankHubAccountConnected = (account: BankHubAccount) => account.bank_api_connected === '1'

export const isBankHubAccountActive = (account: BankHubAccount) => account.active === '1'

export const getBankHubAccountTypeLabel = (dictionary: SystemSettingsDictionary, accountType: string) => {
  const normalized = accountType.trim().toLowerCase()

  if (normalized === 'individual') return integrationsText(dictionary, 'bankhub_account_type_individual')
  if (normalized === 'enterprise') return integrationsText(dictionary, 'bankhub_account_type_enterprise')

  return accountType.trim() || '-'
}

export const getBankHubAccountConnectionLabel = (dictionary: SystemSettingsDictionary, account: BankHubAccount) => (
  integrationsText(dictionary, isBankHubAccountConnected(account)
    ? 'bankhub_account_connection_connected'
    : 'bankhub_account_connection_disconnected')
)

export const getBankHubAccountActiveLabel = (dictionary: SystemSettingsDictionary, account: BankHubAccount) => (
  integrationsText(dictionary, isBankHubAccountActive(account)
    ? 'bankhub_account_status_active'
    : 'bankhub_account_status_inactive')
)

/** "ACB · BIN 970416": bank code and BIN shown under the brand name when available. */
export const getBankHubAccountBankMeta = (account: BankHubAccount) => (
  [account.bank_code, account.bank_bin ? `BIN ${account.bank_bin}` : null].filter(Boolean).join(' · ')
)

const SQL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/

/**
 * Bank Hub returns provider-local "YYYY-MM-DD HH:mm:ss" without a timezone. Reformatted as text only
 * (no Date parsing) so server and browser render the same value and the page never hits a hydration mismatch.
 */
export const formatBankHubAccountDateTime = (value?: string | null) => {
  if (!value) return '-'

  const match = SQL_DATE_TIME_PATTERN.exec(value.trim())

  if (!match) return value.trim() || '-'

  const [, year, month, day, hours, minutes, seconds = '00'] = match

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}
