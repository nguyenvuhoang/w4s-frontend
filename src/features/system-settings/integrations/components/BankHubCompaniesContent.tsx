'use client'

import ApartmentRounded from '@mui/icons-material/ApartmentRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Breadcrumbs,
  Button,
  Grid,
  InputAdornment,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import NextLink from 'next/link'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { Locale } from '@/configs/i18n'
import { resolveRowInteractionMode } from '@/shared/components/table'
import RowInteractionTip from '@/shared/components/table/RowInteractionTip'
import { useRouter } from '@shared/hooks/useRouter'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { buildBankHubCompanyDetailPath } from '../bankhub/bankhub.constants'
import type {
  BankHubCompanyFilter,
  BankHubCompanySearchError,
  BankHubCompanySearchResult
} from '../bankhub/bankhub.types'
import { useBankHubCompanySearch } from '../hooks/useBankHubCompanySearch'
import { integrationsText } from '../integrationModules'
import BankHubCompaniesTable from './BankHubCompaniesTable'

type Props = {
  dictionary: SystemSettingsDictionary
  locale: Locale
  sessiontoken?: string
  initialFilter: BankHubCompanyFilter
  initialData: BankHubCompanySearchResult
  initialError?: BankHubCompanySearchError | null
}

const BankHubCompaniesContent = ({ dictionary, locale, sessiontoken, initialFilter, initialData, initialError }: Props) => {
  const router = useRouter()
  const t = (key: string) => integrationsText(dictionary, key)
  const commonText = (key: string, fallback: string) => (
    (dictionary.common as Record<string, string | undefined> | undefined)?.[key] ?? fallback
  )

  const companies = useBankHubCompanySearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Breadcrumbs sx={{ mb: 1 }}>
            <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline="hover">
              {t('breadcrumb_system_settings')}
            </MuiLink>
            <MuiLink component={NextLink} href={`/${locale}/system-settings/integrations`} underline="hover">
              {t('integrations_hub_title')}
            </MuiLink>
            <Typography color="text.primary">{t('bankhub_companies_title')}</Typography>
          </Breadcrumbs>

          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <ApartmentRounded color="primary" sx={{ fontSize: 38, mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {t('bankhub_companies_title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('bankhub_companies_subtitle')}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                size="small"
                label={t('bankhub_companies_search_label')}
                placeholder={t('bankhub_companies_search_placeholder')}
                value={companies.searchText}
                onChange={event => companies.setSearchText(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !companies.loading) companies.handleSearch()
                }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" gap={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={companies.handleSearch}
                  disabled={companies.loading}
                >
                  {commonText('search', 'Search')}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={companies.handleReset}
                  disabled={companies.loading}
                >
                  {commonText('reset', 'Reset')}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {companies.error && (
          <WorkflowErrorAlert
            title={t('bankhub_companies_error_title')}
            message={companies.error.message}
            workflowId={companies.error.workflowId}
            executionId={companies.error.executionId}
            executionIdLabel={t('bankhub_companies_error_reference')}
            copyLabel={commonText('copy', 'Copy')}
            copiedLabel={t('bankhub_companies_error_reference_copied')}
            copySuccessMessage={t('bankhub_companies_error_reference_copied')}
            copyFailedMessage={t('bankhub_companies_error_reference_copy_failed')}
            retryLabel={commonText('retry', 'Retry')}
            onRetry={() => void companies.loadData()}
          />
        )}

        <RowInteractionTip mode={resolveRowInteractionMode()} dictionary={dictionary} />

        <BankHubCompaniesTable
          dictionary={dictionary}
          rows={companies.rows}
          loading={companies.loading}
          pageSize={companies.filter.page_size}
          onOpenDetail={row => router.push(buildBankHubCompanyDetailPath(locale, row.xid))}
        />

        {companies.totalCount > 0 && (
          <PaginationPage
            page={companies.filter.page}
            pageSize={companies.filter.page_size}
            totalResults={companies.totalCount}
            jumpPage={companies.filter.page}
            handlePageSizeChange={companies.handlePageSizeChange}
            handlePageChange={companies.handlePageChange}
            handleJumpPage={companies.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Paper>
  )
}

export default BankHubCompaniesContent
