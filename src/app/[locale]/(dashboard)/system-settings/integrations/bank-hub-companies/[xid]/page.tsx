import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE } from '@/features/system-settings/integrations/bankhub/bankhub.constants'
import {
  bankHubService,
  getDefaultBankHubTransactionFilter,
  toBankHubAccountSearchError,
  toBankHubCompanySearchError,
  toBankHubTransactionSearchError
} from '@/features/system-settings/integrations/bankhub/bankhub.service'
import type {
  BankHubAccountSearchResult,
  BankHubCompany,
  BankHubCompanySearchError,
  BankHubTransactionSearchResult
} from '@/features/system-settings/integrations/bankhub/bankhub.types'
import BankHubCompanyDetailContent from '@/features/system-settings/integrations/components/BankHubCompanyDetailContent'
import { integrationsText } from '@/features/system-settings/integrations/integrationModules'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { toClientSessionToken } from '@/shared/utils/safeSessionToken'
import logger from '@lib/logger'

type BankHubCompanyDetailPageProps = {
  params: Promise<{
    locale: string
    xid: string
  }>
}

const BankHubCompanyDetailPage = async ({ params }: BankHubCompanyDetailPageProps) => {
  const { locale, xid: xidParam } = await params
  const xid = decodeURIComponent(xidParam)
  const [dictionary, session] = await Promise.all([getDictionary(locale as Locale), auth()])
  const fallbackMessage = integrationsText(dictionary, 'bankhub_company_detail_load_failed')

  const sessiontoken = (await getServerBackendToken()) ?? undefined

  let company: BankHubCompany | null = null
  let error: BankHubCompanySearchError | null = null
  let accounts: BankHubAccountSearchResult | null = null
  let accountsError: BankHubCompanySearchError | null = null
  let transactions: BankHubTransactionSearchResult | null = null
  let transactionsError: BankHubCompanySearchError | null = null

  try {
    company = await bankHubService.getCompanyByXid({
      sessiontoken,
      language: locale as Locale,
      xid,
      fallbackMessage
    })
  } catch (caught) {
    error = toBankHubCompanySearchError(caught, fallbackMessage)
    logger.error('[bank-hub-companies] Unable to load company detail', caught)
  }

  // Bank account and transaction sections fail on their own: an error there never breaks the company detail.
  if (company?.xid) {
    const companyXid = company.xid
    const provider = company.provider
    const accountsFallback = integrationsText(dictionary, 'bankhub_account_load_failed')
    const transactionsFallback = integrationsText(dictionary, 'bankhub_transaction_load_failed')

    await Promise.all([
      bankHubService.searchAccounts({
        sessiontoken,
        language: locale as Locale,
        companyXid,
        provider,
        filter: { page: 1, page_size: BANKHUB_ACCOUNT_DEFAULT_PAGE_SIZE },
        fallbackMessage: accountsFallback
      }).then(result => {
        accounts = result
      }).catch(caught => {
        accountsError = toBankHubAccountSearchError(caught, accountsFallback)
        logger.error('[bank-hub-companies] Unable to load company bank accounts', caught)
      }),
      bankHubService.searchTransactions({
        sessiontoken,
        language: locale as Locale,
        companyXid,
        provider,
        filter: getDefaultBankHubTransactionFilter(),
        fallbackMessage: transactionsFallback
      }).then(result => {
        transactions = result
      }).catch(caught => {
        transactionsError = toBankHubTransactionSearchError(caught, transactionsFallback)
        logger.error('[bank-hub-companies] Unable to load company Bank Hub transactions', caught)
      })
    ])
  }

  return (
    <Box sx={{ p: 6 }}>
      <BankHubCompanyDetailContent
        dictionary={dictionary}
        locale={locale as Locale}
        sessiontoken={toClientSessionToken(session) ?? ''}
        company={company}
        error={error}
        accounts={accounts}
        accountsError={accountsError}
        transactions={transactions}
        transactionsError={transactionsError}
      />
    </Box>
  )
}

export default BankHubCompanyDetailPage
