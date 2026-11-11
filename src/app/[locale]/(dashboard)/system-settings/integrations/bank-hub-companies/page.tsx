import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { BANKHUB_COMPANY_DEFAULT_PAGE_SIZE } from '@/features/system-settings/integrations/bankhub/bankhub.constants'
import {
  bankHubService,
  getEmptyBankHubCompanySearchResult,
  toBankHubCompanySearchError
} from '@/features/system-settings/integrations/bankhub/bankhub.service'
import type {
  BankHubCompanyFilter,
  BankHubCompanySearchError
} from '@/features/system-settings/integrations/bankhub/bankhub.types'
import BankHubCompaniesContent from '@/features/system-settings/integrations/components/BankHubCompaniesContent'
import { integrationsText } from '@/features/system-settings/integrations/integrationModules'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { toClientSessionToken } from '@/shared/utils/safeSessionToken'
import logger from '@lib/logger'

type BankHubCompaniesPageProps = {
  params: Promise<{
    locale: string
  }>
}

const initialFilter: BankHubCompanyFilter = {
  search_text: '',
  page: 1,
  page_size: BANKHUB_COMPANY_DEFAULT_PAGE_SIZE
}

const BankHubCompaniesPage = async ({ params }: BankHubCompaniesPageProps) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale as Locale), auth()])
  const fallbackMessage = integrationsText(dictionary, 'bankhub_companies_load_failed')

  let initialData = getEmptyBankHubCompanySearchResult(initialFilter)
  let initialError: BankHubCompanySearchError | null = null

  try {
    initialData = await bankHubService.searchCompanies({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale as Locale,
      filter: initialFilter,
      fallbackMessage
    })
  } catch (error) {
    initialError = toBankHubCompanySearchError(error, fallbackMessage)
    logger.error('[bank-hub-companies] Unable to load initial data', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <BankHubCompaniesContent
        dictionary={dictionary}
        locale={locale as Locale}
        sessiontoken={toClientSessionToken(session) ?? ''}
        initialFilter={initialFilter}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default BankHubCompaniesPage
