'use client'

import { useMemo } from 'react'

import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import { Button, Grid, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { Locale } from '@/configs/i18n'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  getBankHubAccountOptionLabel,
  getBankHubBrandOptions
} from '../bankhub/bankhub-transaction.mapper'
import type {
  BankHubAccount,
  BankHubCompanySearchError,
  BankHubTransactionSearchResult
} from '../bankhub/bankhub.types'
import { useBankHubCompanyTransactions } from '../hooks/useBankHubCompanyTransactions'
import type { BankHubTransactionFilterField } from '../hooks/useBankHubCompanyTransactions'
import { integrationsText } from '../integrationModules'
import BankHubCompanyTransactionsTable from './BankHubCompanyTransactionsTable'

type Props = {
  dictionary: SystemSettingsDictionary
  locale: Locale
  sessiontoken?: string
  companyXid: string
  provider?: string | null
  /** Known bank accounts of the company (from the bank account section) used for the account/bank filters. */
  accounts: BankHubAccount[]
  initialData: BankHubTransactionSearchResult
  initialError?: BankHubCompanySearchError | null
}

const BankHubCompanyTransactionsSection = ({
  dictionary,
  locale,
  sessiontoken,
  companyXid,
  provider,
  accounts,
  initialData,
  initialError = null
}: Props) => {
  const t = (key: string) => integrationsText(dictionary, key)
  const commonText = (key: string, fallback: string) => (
    (dictionary.common as Record<string, string | undefined> | undefined)?.[key] ?? fallback
  )

  const transactions = useBankHubCompanyTransactions({
    dictionary,
    sessiontoken,
    language: locale,
    companyXid,
    provider,
    initialData,
    initialError
  })

  const { filter } = transactions
  const brandOptions = useMemo(() => getBankHubBrandOptions(accounts), [accounts])

  const selectProps = (field: BankHubTransactionFilterField, label: string) => ({
    select: true,
    fullWidth: true,
    size: 'small' as const,
    label,
    value: filter[field],
    disabled: transactions.loading,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => transactions.handleFilterChange(field, event.target.value),
    slotProps: { inputLabel: { shrink: true }, select: { displayEmpty: true } }
  })

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={1.5}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongOutlinedIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t('bankhub_transaction_title')}
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={transactions.reload}
            disabled={transactions.loading || !companyXid}
            sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            {t('bankhub_transaction_refresh')}
          </Button>
        </Stack>

        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, lg: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={commonText('search', 'Search')}
              placeholder={t('bankhub_transaction_search_placeholder')}
              value={transactions.searchInput}
              onChange={event => transactions.setSearchInput(event.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TextField {...selectProps('bank_account_xid', t('bankhub_transaction_filter_account'))}>
              <MenuItem value="">{t('bankhub_transaction_filter_account_all')}</MenuItem>
              {accounts.map(account => (
                <MenuItem key={account.xid} value={account.xid}>{getBankHubAccountOptionLabel(account)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <TextField {...selectProps('brand_name', t('bankhub_transaction_filter_bank'))}>
              <MenuItem value="">{t('bankhub_transaction_filter_bank_all')}</MenuItem>
              {brandOptions.map(brand => <MenuItem key={brand} value={brand}>{brand}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
            <TextField {...selectProps('transfer_type', t('bankhub_transaction_filter_transfer_type'))}>
              <MenuItem value="">{t('bankhub_transaction_filter_all')}</MenuItem>
              <MenuItem value="credit">{t('bankhub_transaction_transfer_type_credit')}</MenuItem>
              <MenuItem value="debit">{t('bankhub_transaction_transfer_type_debit')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
            <TextField {...selectProps('webhook_success', t('bankhub_transaction_filter_webhook'))}>
              <MenuItem value="">{t('bankhub_transaction_filter_all')}</MenuItem>
              <MenuItem value="1">{t('bankhub_transaction_webhook_success')}</MenuItem>
              <MenuItem value="0">{t('bankhub_transaction_webhook_failed')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t('bankhub_transaction_filter_from_date')}
              value={filter.start_transaction_date}
              disabled={transactions.loading}
              onChange={event => transactions.handleFilterChange('start_transaction_date', event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filter.end_transaction_date || undefined } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t('bankhub_transaction_filter_to_date')}
              value={filter.end_transaction_date}
              disabled={transactions.loading}
              onChange={event => transactions.handleFilterChange('end_transaction_date', event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filter.start_transaction_date || undefined } }}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 2 }}>
            <Button
              fullWidth
              variant="text"
              startIcon={<FilterAltOffOutlinedIcon />}
              onClick={transactions.resetFilters}
              disabled={transactions.loading || !transactions.hasActiveFilters}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('bankhub_transaction_clear_filters')}
            </Button>
          </Grid>
        </Grid>

        {transactions.error && (
          <WorkflowErrorAlert
            title={t('bankhub_transaction_error_title')}
            message={transactions.error.message}
            workflowId={transactions.error.workflowId}
            executionId={transactions.error.executionId}
            executionIdLabel={t('bankhub_companies_error_reference')}
            copyLabel={commonText('copy', 'Copy')}
            copiedLabel={t('bankhub_companies_error_reference_copied')}
            copySuccessMessage={t('bankhub_companies_error_reference_copied')}
            copyFailedMessage={t('bankhub_companies_error_reference_copy_failed')}
            retryLabel={commonText('retry', 'Retry')}
            onRetry={transactions.reload}
          />
        )}

        {!transactions.error && (
          <BankHubCompanyTransactionsTable
            dictionary={dictionary}
            rows={transactions.rows}
            loading={transactions.loading}
            pageSize={filter.page_size}
          />
        )}

        {!transactions.error && transactions.totalCount > 0 && (
          <PaginationPage
            page={filter.page}
            pageSize={filter.page_size}
            totalResults={transactions.totalCount}
            jumpPage={filter.page}
            handlePageSizeChange={transactions.handlePageSizeChange}
            handlePageChange={transactions.handlePageChange}
            handleJumpPage={transactions.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Paper>
  )
}

export default BankHubCompanyTransactionsSection
