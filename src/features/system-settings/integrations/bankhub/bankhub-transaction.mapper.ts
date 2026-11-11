import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'
import { formatBankHubAccountDateTime } from './bankhub-account.mapper'
import type { BankHubAccount, BankHubTransaction } from './bankhub.types'

/** Same provider-local "YYYY-MM-DD HH:mm:ss" text formatting as bank accounts (no hydration mismatch). */
export const formatBankHubTransactionDateTime = formatBankHubAccountDateTime

export const isBankHubTransactionCredit = (transaction: BankHubTransaction) => transaction.transfer_type === 'credit'

export const isBankHubTransactionDebit = (transaction: BankHubTransaction) => transaction.transfer_type === 'debit'

const amountFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

/** "+500.000" for credit, "-500.000" for debit, plain value otherwise. */
export const formatBankHubTransactionAmount = (transaction: BankHubTransaction) => {
  if (!Number.isFinite(transaction.amount)) return '-'

  const formatted = amountFormatter.format(Math.abs(transaction.amount))

  if (isBankHubTransactionCredit(transaction)) return `+${formatted}`
  if (isBankHubTransactionDebit(transaction)) return `-${formatted}`

  return amountFormatter.format(transaction.amount)
}

export const getBankHubTransferTypeLabel = (dictionary: SystemSettingsDictionary, transferType: string) => {
  if (transferType === 'credit') return integrationsText(dictionary, 'bankhub_transaction_transfer_type_credit')
  if (transferType === 'debit') return integrationsText(dictionary, 'bankhub_transaction_transfer_type_debit')

  return transferType.trim() || '-'
}

export const isBankHubTransactionWebhookSuccess = (transaction: BankHubTransaction) => transaction.webhook_success === 1

export const getBankHubTransactionWebhookLabel = (dictionary: SystemSettingsDictionary, transaction: BankHubTransaction) => {
  if (transaction.webhook_success === null || transaction.webhook_success === undefined) return '-'

  return integrationsText(dictionary, isBankHubTransactionWebhookSuccess(transaction)
    ? 'bankhub_transaction_webhook_success'
    : 'bankhub_transaction_webhook_failed')
}

/** "ACB - 4567890123" for the account filter option. */
export const getBankHubAccountOptionLabel = (account: BankHubAccount) => (
  [account.brand_name || account.bank_code, account.account_number].filter(Boolean).join(' - ') || account.xid
)

/** Unique accounts (by xid) keeping first-seen order. */
export const mergeBankHubAccountOptions = (...lists: BankHubAccount[][]) => {
  const map = new Map<string, BankHubAccount>()

  lists.flat().forEach(account => {
    if (account.xid && !map.has(account.xid)) map.set(account.xid, account)
  })

  return [...map.values()]
}

/** Unique, sorted bank brand names of the known accounts. */
export const getBankHubBrandOptions = (accounts: BankHubAccount[]) => (
  [...new Set(accounts.map(account => account.brand_name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
)
