'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Button,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'

import PaginationPage from '@/@core/components/jTable/pagination'
import { useRowInteraction } from '@/shared/components/table'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { feeTemplatesHref } from '../feeTemplate.constants'
import type { FeeTemplateFilter, FeeTemplateItem, FeeTemplateSearchResult } from '../feeTemplate.service'
import { feeSettingsText } from '../feeSettingsModules'
import { useFeeTemplateSearch } from '../hooks/useFeeTemplateSearch'
import {
  getNotificationTemplateCodeListCaption,
  getNotificationTemplateStatusCaption,
  NOTIFICATION_TEMPLATE_ALL_CHANNEL,
  useNotificationTemplateCodeLists
} from '../hooks/useNotificationTemplateCodeLists'
import FeeSettingsPageHeader from './FeeSettingsPageHeader'

type FeeTemplatesContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  initialFilter: FeeTemplateFilter
  initialData: FeeTemplateSearchResult
  initialError?: WorkflowErrorDetail | null
}

const headerCellSx = { bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }

const columns = [
  ['field_template_code', 'Template code'],
  ['field_template_name', 'Template name'],
  ['field_template_group', 'Template group'],
  ['field_channel', 'Channel'],
  ['field_is_default', 'Default'],
  ['field_status', 'Status']
] as const

/**
 * Fee notification templates (group FEE). O24 list: no action column, a single click on
 * a row opens the detail page (shared useRowInteraction); Edit / Clone / Delete live on the detail.
 * The workflow documents no status filter, so only channel + search text are offered.
 */
const FeeTemplatesContent = ({
  dictionary,
  locale,
  session,
  initialFilter,
  initialData,
  initialError = null
}: FeeTemplatesContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const codeLists = useNotificationTemplateCodeLists(locale)
  const templates = useFeeTemplateSearch({
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError,
    loadFailedMessage: text('template_load_failed', 'Unable to load templates.')
  })
  const { filter } = templates
  const { getRowProps } = useRowInteraction<FeeTemplateItem>({
    mode: 'single-click',
    getDetailUrl: row => (row.id ? feeTemplatesHref(locale, `/${row.id}`) : null),
    isRowInteractive: row => Boolean(row.id)
  })

  return (
    <Stack spacing={4}>
      <FeeSettingsPageHeader
        dictionary={dictionary}
        locale={locale}
        moduleKey='fee-templates'
        actions={(
          <Button component={NextLink} href={feeTemplatesHref(locale, '/new')} variant='contained' startIcon={<AddRounded />}>
            {text('template_create_action', 'New template')}
          </Button>
        )}
      />

      <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              size='small'
              label={text('search', 'Search')}
              value={templates.searchInput}
              onChange={event => templates.setSearchInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') templates.handleSearch()
              }}
              placeholder={text('template_search_placeholder', 'Search by template code or name')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchRounded fontSize='small' />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              size='small'
              label={text('field_channel', 'Channel')}
              value={filter.channel || NOTIFICATION_TEMPLATE_ALL_CHANNEL}
              onChange={event => {
                const channel = String(event.target.value)

                templates.handleChannelChange(channel === NOTIFICATION_TEMPLATE_ALL_CHANNEL ? '' : channel)
              }}
              disabled={codeLists.isLoading}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              {codeLists.channelOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction='row' justifyContent='flex-end' gap={1} sx={{ mt: 2 }}>
          <Button variant='outlined' startIcon={<RestartAltRounded />} onClick={templates.handleReset} disabled={templates.loading}>
            {text('reset', 'Reset')}
          </Button>
          <Button variant='contained' startIcon={<SearchRounded />} onClick={templates.handleSearch} disabled={templates.loading}>
            {text('search', 'Search')}
          </Button>
        </Stack>
      </Paper>

      {codeLists.error && <Alert severity='error' variant='outlined'>{text('template_codelist_load_failed', 'Unable to load notification template options.')}</Alert>}

      {templates.error && (
        <WorkflowErrorAlert
          title={text('template_load_failed', 'Unable to load templates.')}
          message={templates.error.message}
          workflowId={templates.error.workflowId}
          errorCode={templates.error.errorCode}
          executionId={templates.error.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
          retryLabel={dictionary.common?.retry ?? 'Retry'}
          onRetry={() => void templates.reload()}
        />
      )}

      <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table size='small' sx={{ minWidth: 880 }}>
          <TableHead>
            <TableRow>
              {columns.map(([key, fallback]) => <TableCell key={key} sx={headerCellSx}>{text(key, fallback)}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.loading && Array.from({ length: Math.min(filter.page_size, 5) }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columns.length}><Skeleton height={28} /></TableCell>
              </TableRow>
            ))}

            {!templates.loading && !templates.error && templates.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align='center' sx={{ py: 8 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>{text('template_empty', 'No templates found.')}</Typography>
                </TableCell>
              </TableRow>
            )}

            {!templates.loading && templates.rows.map((row, index) => (
              <TableRow key={row.id ?? `${row.template_code}-${index}`} {...getRowProps(row)}>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'primary.main' }}>{row.template_code || '-'}</TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.template_name || '-'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{getNotificationTemplateCodeListCaption(codeLists.groupCaptionMap, row.template_group)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{getNotificationTemplateCodeListCaption(codeLists.channelCaptionMap, row.channel)}</TableCell>
                <TableCell>
                  <Chip size='small' variant='outlined' color={row.is_default ? 'primary' : 'default'} label={row.is_default ? text('yes', 'Yes') : text('no_value', 'No')} />
                </TableCell>
                <TableCell>
                  {row.status
                    ? <Chip size='small' variant='outlined' label={getNotificationTemplateStatusCaption(codeLists.statusCaptionMap, row.status)} />
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {templates.totalCount > 0 && (
        <PaginationPage
          page={filter.page_index}
          pageSize={filter.page_size}
          totalResults={templates.totalCount}
          jumpPage={filter.page_index}
          handlePageChange={templates.handlePageChange}
          handlePageSizeChange={templates.handlePageSizeChange}
          handleJumpPage={templates.handleJumpPage}
          dictionary={dictionary}
        />
      )}
    </Stack>
  )
}

export default FeeTemplatesContent
