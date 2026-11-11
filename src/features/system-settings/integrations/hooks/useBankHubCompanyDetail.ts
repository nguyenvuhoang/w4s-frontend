'use client'

import { useCallback } from 'react'

import { useRouter } from '@shared/hooks/useRouter'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { BANKHUB_PURPOSE_LINK_BANK_ACCOUNT, buildBankHubCompanyDetailPath } from '../bankhub/bankhub.constants'
import type { BankHubCompany } from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'
import { useBankHubIntegration } from './useBankHubIntegration'

type Params = {
  dictionary: SystemSettingsDictionary
  locale: string
  sessiontoken?: string
  company: BankHubCompany | null
  /** Refetches the bank account section in place; falls back to re-running the server page. */
  onBankAccountLinked?: () => void
}

export const useBankHubCompanyDetail = ({ dictionary, locale, sessiontoken, company, onBankAccountLinked }: Params) => {
  const router = useRouter()

  const refresh = useCallback(() => {
    if (onBankAccountLinked) onBankAccountLinked()
    else router.refresh()
  }, [onBankAccountLinked, router])

  const bankHub = useBankHubIntegration({ dictionary, locale, sessiontoken, onBankAccountLinked: refresh })

  const linkBankAccount = () => {
    if (!company) return

    void bankHub.connect({
      provider: company.provider,
      company_xid: company.xid,
      purpose: BANKHUB_PURPOSE_LINK_BANK_ACCOUNT,
      bank_account_xid: null,
      completion_redirect_uri: `${window.location.origin}${buildBankHubCompanyDetailPath(locale, company.xid)}`,
      is_mobile_app: 0,
      language: locale || 'vi'
    })
  }

  const linkBusyLabel = bankHub.isCreatingLink
    ? integrationsText(dictionary, 'integrations_bankhub_creating_link')
    : bankHub.isSdkLoading
      ? integrationsText(dictionary, 'integrations_bankhub_sdk_loading')
      : null

  return {
    linkBankAccount,
    isLinkBusy: linkBusyLabel !== null || bankHub.isBankHubOpen,
    linkBusyLabel,
    handleSdkReady: bankHub.handleSdkReady,
    handleSdkError: bankHub.handleSdkError
  }
}
