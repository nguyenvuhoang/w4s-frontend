'use client'

import { useMemo, type ReactNode } from 'react'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AddIcon from '@mui/icons-material/Add'
import ApartmentRounded from '@mui/icons-material/ApartmentRounded'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import NextLink from 'next/link'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { Locale } from '@/configs/i18n'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { formatDateTime } from '@/shared/utils/formatDateTime'
import { useRouter } from '@shared/hooks/useRouter'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  displayBankHubValue,
  getBankHubCompanyActiveLabel,
  getBankHubCompanyStatusLabel,
  isBankHubCompanyActiveStatus
} from '../bankhub/bankhub-company.mapper'
import { buildBankHubCompaniesPath } from '../bankhub/bankhub.constants'
import { mergeBankHubAccountOptions } from '../bankhub/bankhub-transaction.mapper'
import {
  getEmptyBankHubAccountSearchResult,
  getEmptyBankHubTransactionSearchResult
} from '../bankhub/bankhub.service'
import type {
  BankHubAccountSearchResult,
  BankHubCompany,
  BankHubCompanyConfiguration,
  BankHubCompanySearchError,
  BankHubTransactionSearchResult
} from '../bankhub/bankhub.types'
import { useBankHubCompanyAccounts } from '../hooks/useBankHubCompanyAccounts'
import { useBankHubCompanyDetail } from '../hooks/useBankHubCompanyDetail'
import { integrationsText } from '../integrationModules'
import BankHubCompanyAccountsTable from './BankHubCompanyAccountsTable'
import BankHubCompanyTransactionsSection from './BankHubCompanyTransactionsSection'
import BankHubSdkScript from './BankHubSdkScript'

type Props = {
  dictionary: SystemSettingsDictionary
  locale: Locale
  sessiontoken?: string
  company: BankHubCompany | null
  error?: BankHubCompanySearchError | null
  /** First page of WF_BO_GET_BANKHUB_ACCOUNTS loaded by the server page (null when the company was not loaded). */
  accounts?: BankHubAccountSearchResult | null
  accountsError?: BankHubCompanySearchError | null
  /** First page of WF_BO_GET_BANK_HUB_TRANSACTIONS loaded by the server page (null when the company was not loaded). */
  transactions?: BankHubTransactionSearchResult | null
  transactionsError?: BankHubCompanySearchError | null
}

const emptyAccounts = getEmptyBankHubAccountSearchResult()
const emptyTransactions = getEmptyBankHubTransactionSearchResult()

const DetailField = ({ label, children, md = 6 }: { label: string; children: ReactNode; md?: number }) => (
  <Grid size={{ xs: 12, md }}>
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', wordBreak: 'break-word' }}>
        {children}
      </Box>
    </Stack>
  </Grid>
)

const configurationFields: (keyof BankHubCompanyConfiguration)[] = [
  'payment_code',
  'payment_code_prefix',
  'payment_code_suffix_from',
  'payment_code_suffix_to',
  'payment_code_suffix_character_type',
  'data_storage_time',
  'transaction_amount'
]

const formatConfigurationValue = (key: keyof BankHubCompanyConfiguration, value: BankHubCompanyConfiguration[typeof key]) => {
  if (key === 'transaction_amount' && value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
    return new Intl.NumberFormat('vi-VN').format(Number(value))
  }

  return displayBankHubValue(value)
}

const BankHubCompanyDetailContent = ({
  dictionary,
  locale,
  sessiontoken,
  company,
  error,
  accounts = null,
  accountsError = null,
  transactions = null,
  transactionsError = null
}: Props) => {
  const router = useRouter()
  const t = (key: string) => integrationsText(dictionary, key)
  const commonText = (key: string, fallback: string) => (
    (dictionary.common as Record<string, string | undefined> | undefined)?.[key] ?? fallback
  )

  const bankAccounts = useBankHubCompanyAccounts({
    dictionary,
    sessiontoken,
    language: locale,
    companyXid: company?.xid ?? '',
    provider: company?.provider,
    initialData: accounts ?? emptyAccounts,
    initialError: accountsError
  })

  // A successful link refetches only the bank account section (no full page reload).
  const detail = useBankHubCompanyDetail({
    dictionary,
    locale,
    sessiontoken,
    company,
    onBankAccountLinked: bankAccounts.reloadFirstPage
  })
  const listPath = buildBankHubCompaniesPath(locale)

  // Account filter options of the transaction section: first page from the server + accounts seen while paging.
  const initialAccountItems = accounts?.items
  const accountOptions = useMemo(
    () => mergeBankHubAccountOptions(initialAccountItems ?? [], bankAccounts.rows),
    [initialAccountItems, bankAccounts.rows]
  )

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <BankHubSdkScript onReady={detail.handleSdkReady} onError={detail.handleSdkError} />

      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
              {t('breadcrumb_system_settings')}
            </MuiLink>
            <MuiLink component={NextLink} href={`/${locale}/system-settings/integrations`} underline="hover">
              {t('integrations_hub_title')}
            </MuiLink>
            <MuiLink component={NextLink} href={listPath} underline="hover">
              {t('bankhub_companies_title')}
            </MuiLink>
            <Typography color="text.primary">{t('bankhub_company_detail_title')}</Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <ApartmentRounded color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {t('bankhub_company_detail_title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('bankhub_company_detail_subtitle')}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(listPath)} sx={{ alignSelf: 'flex-start' }}>
          {t('bankhub_company_back_to_list')}
        </Button>

        {error && (
          <WorkflowErrorAlert
            title={t('bankhub_company_detail_error_title')}
            message={error.message}
            workflowId={error.workflowId}
            executionId={error.executionId}
            executionIdLabel={t('bankhub_companies_error_reference')}
            copyLabel={commonText('copy', 'Copy')}
            copiedLabel={t('bankhub_companies_error_reference_copied')}
            copySuccessMessage={t('bankhub_companies_error_reference_copied')}
            copyFailedMessage={t('bankhub_companies_error_reference_copy_failed')}
            retryLabel={commonText('retry', 'Retry')}
            onRetry={() => router.refresh()}
          />
        )}

        {!company ? (
          !error && <Alert severity="info">{t('bankhub_company_detail_not_found')}</Alert>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Stack spacing={2.5}>
                <Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                  {displayBankHubValue(company.full_name)}
                </Typography>

                <Grid container spacing={2.25}>
                  <DetailField label={t('bankhub_companies_column_provider')}>
                    <Chip size="small" variant="outlined" color="info" label={displayBankHubValue(company.provider)} />
                  </DetailField>
                  <DetailField label={t('bankhub_companies_column_full_name')}>
                    <Typography>{displayBankHubValue(company.full_name)}</Typography>
                  </DetailField>
                  <DetailField label={t('bankhub_companies_column_xid')}>
                    <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {displayBankHubValue(company.xid)}
                    </Typography>
                  </DetailField>
                  <DetailField label={t('bankhub_companies_column_status')}>
                    <Chip
                      size="small"
                      color={isBankHubCompanyActiveStatus(company.status) ? 'success' : 'default'}
                      label={getBankHubCompanyStatusLabel(dictionary, company.status)}
                    />
                  </DetailField>
                  <DetailField label={t('bankhub_companies_column_is_active')}>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={company.is_active ? 'success' : 'default'}
                      label={getBankHubCompanyActiveLabel(dictionary, company.is_active)}
                    />
                  </DetailField>
                  {company.created_at && (
                    <DetailField label={t('bankhub_company_field_created_at')}>
                      <Typography>{formatDateTime(company.created_at) || '-'}</Typography>
                    </DetailField>
                  )}
                </Grid>

                {company.configuration && (
                  <>
                    <Divider />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {t('bankhub_company_configuration_title')}
                    </Typography>
                    <Grid container spacing={2.25}>
                      {configurationFields.map(key => (
                        <DetailField key={key} label={t(`bankhub_company_config_${key}`)} md={4}>
                          <Typography>{formatConfigurationValue(key, company.configuration?.[key])}</Typography>
                        </DetailField>
                      ))}
                    </Grid>
                  </>
                )}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  gap={1.5}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountBalanceOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {t('bankhub_company_bank_accounts_title')}
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    startIcon={detail.linkBusyLabel ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    onClick={detail.linkBankAccount}
                    disabled={detail.isLinkBusy || !company.xid}
                    sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }}
                  >
                    {detail.linkBusyLabel ?? t('bankhub_company_link_bank_account')}
                  </Button>
                </Stack>

                {bankAccounts.error && (
                  <WorkflowErrorAlert
                    title={t('bankhub_account_error_title')}
                    message={bankAccounts.error.message}
                    workflowId={bankAccounts.error.workflowId}
                    executionId={bankAccounts.error.executionId}
                    executionIdLabel={t('bankhub_companies_error_reference')}
                    copyLabel={commonText('copy', 'Copy')}
                    copiedLabel={t('bankhub_companies_error_reference_copied')}
                    copySuccessMessage={t('bankhub_companies_error_reference_copied')}
                    copyFailedMessage={t('bankhub_companies_error_reference_copy_failed')}
                    retryLabel={commonText('retry', 'Retry')}
                    onRetry={bankAccounts.reload}
                  />
                )}

                {!bankAccounts.error && (
                  <BankHubCompanyAccountsTable
                    dictionary={dictionary}
                    rows={bankAccounts.rows}
                    loading={bankAccounts.loading}
                    pageSize={bankAccounts.filter.page_size}
                  />
                )}

                {!bankAccounts.error && bankAccounts.totalCount > 0 && (
                  <PaginationPage
                    page={bankAccounts.filter.page}
                    pageSize={bankAccounts.filter.page_size}
                    totalResults={bankAccounts.totalCount}
                    jumpPage={bankAccounts.filter.page}
                    handlePageSizeChange={bankAccounts.handlePageSizeChange}
                    handlePageChange={bankAccounts.handlePageChange}
                    handleJumpPage={bankAccounts.handleJumpPage}
                    dictionary={dictionary}
                  />
                )}
              </Stack>
            </Paper>

            <BankHubCompanyTransactionsSection
              dictionary={dictionary}
              locale={locale}
              sessiontoken={sessiontoken}
              companyXid={company.xid}
              provider={company.provider}
              accounts={accountOptions}
              initialData={transactions ?? emptyTransactions}
              initialError={transactionsError}
            />
          </>
        )}
      </Stack>
    </Paper>
  )
}

export default BankHubCompanyDetailContent
