'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import BoltRounded from '@mui/icons-material/BoltRounded'
import {
  Alert,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'
import { useMemo, useState } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { FeePeriodFilterModel, FeePeriodItem, FeePeriodSearchResponse, FeeProjectOption } from '@/features/fees/types'
import { useRowInteraction } from '@/shared/components/table'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  buildFeePeriodName,
  feePeriodsHref,
  formatFeePeriodDueDate,
  formatFeePeriodMonth,
  getFeePeriodStatusColor
} from '../feePeriod.helpers'
import { feeSettingsText } from '../feeSettingsModules'
import { useFeePeriodSearch } from '../hooks/useFeePeriodSearch'
import { getFeePeriodStatusCaption, useFeePeriodStatusCodeList } from '../hooks/useFeePeriodStatusCodeList'
import FeePeriodFilterBar from './FeePeriodFilterBar'
import FeePeriodGenerateDialog from './FeePeriodGenerateDialog'
import FeeSettingsPageHeader from './FeeSettingsPageHeader'

type FeePeriodsContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  initialFilter: FeePeriodFilterModel
  initialData: FeePeriodSearchResponse
  initialError?: WorkflowErrorDetail | null
  projects: FeeProjectOption[]
  projectsError?: WorkflowErrorDetail | null
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const textCellSx = {
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: 1.45
}

const columns = [
  ['no', 'No.'],
  ['field_period_code', 'Period code'],
  ['field_period', 'Period'],
  ['field_period_name', 'Period name'],
  ['field_project', 'Project'],
  ['field_due_date', 'Due date'],
  ['field_status', 'Status']
] as const

/**
 * Fee period list (WF_BO_ADVANCED_SEARCH_FEE_PERIOD) across all projects (project filter optional).
 * No row actions (O24 convention): a single click on a row (or Enter on a focused row) opens the
 * detail page through the shared useRowInteraction; Edit / Delete live on the detail page.
 * Access to the whole System Settings area is enforced by its layout (Super Admin boundary).
 */
const FeePeriodsContent = ({
  dictionary,
  locale,
  session,
  initialFilter,
  initialData,
  initialError = null,
  projects,
  projectsError = null
}: FeePeriodsContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const sessiontoken = session?.user?.token ?? undefined
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const periods = useFeePeriodSearch({
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError,
    loadFailedMessage: text('period_load_failed', 'Unable to load fee periods.')
  })
  const { filter } = periods
  // The search workflow returns no period name: it is built from month/year with the i18n pattern.
  const periodNamePattern = text('period_name_generated', 'Fee period for {MM}/{year}')
  const statusCodes = useFeePeriodStatusCodeList(locale)
  const hasActiveFilter = Boolean(filter.search_text || filter.project_id || filter.year || filter.month || filter.status)
  const projectNames = useMemo(() => new Map(projects.map(project => [project.id, project.name])), [projects])

  const { getRowProps } = useRowInteraction<FeePeriodItem>({
    mode: 'single-click',
    getDetailUrl: row => (row.id ? feePeriodsHref(locale, `/${row.id}`) : null),
    isRowInteractive: row => Boolean(row.id)
  })

  const projectLabel = (projectId: number | null) => {
    if (!projectId) return '-'

    // Project missing from the loaded list (no access, inactive or list failed): show its ID instead.
    return projectNames.get(projectId) ?? text('project_unknown', 'Project #{id}').replace('{id}', String(projectId))
  }

  return (
    <Stack spacing={4}>
      <FeeSettingsPageHeader
        dictionary={dictionary}
        locale={locale}
        moduleKey='fee-periods'
        actions={(
          <>
            <Button variant='outlined' startIcon={<BoltRounded />} onClick={() => setQuickCreateOpen(true)}>
              {text('quick_create_action', 'Quick create')}
            </Button>
            <Button component={NextLink} href={feePeriodsHref(locale, '/create')} variant='contained' startIcon={<AddRounded />}>
              {text('period_create_action', 'Add period')}
            </Button>
          </>
        )}
      />

      <FeePeriodFilterBar
        dictionary={dictionary}
        filter={filter}
        searchInput={periods.searchInput}
        projects={projects}
        statusOptions={statusCodes.options}
        statusLoading={statusCodes.isLoading}
        loading={periods.loading}
        onSearchInputChange={periods.setSearchInput}
        onFilterChange={periods.handleFilterChange}
        onSearch={periods.handleSearch}
        onReset={periods.handleReset}
      />

      {statusCodes.error && (
        <Alert severity='warning'>
          {text('status_codes_load_failed', 'Unable to load the fee period statuses (CodeList IPS / FEE_PERIOD_STATUS).')}
        </Alert>
      )}

      {projectsError && (
        <WorkflowErrorAlert
          title={text('projects_load_failed', 'Unable to load projects.')}
          message={projectsError.message}
          workflowId={projectsError.workflowId}
          errorCode={projectsError.errorCode}
          executionId={projectsError.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
        />
      )}

      {periods.error && (
        <WorkflowErrorAlert
          title={text('period_load_failed', 'Unable to load fee periods.')}
          message={periods.error.message}
          workflowId={periods.error.workflowId}
          errorCode={periods.error.errorCode}
          executionId={periods.error.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
          retryLabel={dictionary.common?.retry ?? 'Retry'}
          onRetry={() => void periods.reload()}
        />
      )}

      <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table size='small' sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow>
              {columns.map(([key, fallback]) => (
                <TableCell key={key} sx={headerCellSx}>{text(key, fallback)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.loading && Array.from({ length: Math.min(filter.page_size, 5) }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columns.length}><Skeleton height={28} /></TableCell>
              </TableRow>
            ))}

            {!periods.loading && !periods.error && periods.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align='center' sx={{ py: 8 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                    {text('period_empty_title', 'No fee periods yet')}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {hasActiveFilter
                      ? text('period_empty_search_description', 'No fee periods match the filters.')
                      : text('period_empty_list_description', 'No fee periods have been set up yet.')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!periods.loading && periods.rows.map((row, index) => (
              <TableRow key={row.id ?? `${row.period_code}-${index}`} {...getRowProps(row)}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{(filter.page_index - 1) * filter.page_size + index + 1}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: 'primary.main' }}>{row.period_code || '-'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFeePeriodMonth(row.year, row.month)}</TableCell>
                <TableCell sx={textCellSx}>{buildFeePeriodName(periodNamePattern, row.year, row.month)}</TableCell>
                <TableCell sx={textCellSx}>{projectLabel(row.project_id)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFeePeriodDueDate(row.due_date)}</TableCell>
                <TableCell>
                  {row.status
                    ? <Chip size='small' variant='outlined' color={getFeePeriodStatusColor(row.status)} label={getFeePeriodStatusCaption(statusCodes.captionMap, row.status)} />
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {periods.totalCount > 0 && (
        <PaginationPage
          page={filter.page_index}
          pageSize={filter.page_size}
          totalResults={periods.totalCount}
          jumpPage={filter.page_index}
          handlePageChange={periods.handlePageChange}
          handlePageSizeChange={periods.handlePageSizeChange}
          handleJumpPage={periods.handleJumpPage}
          dictionary={dictionary}
        />
      )}

      <FeePeriodGenerateDialog
        dictionary={dictionary}
        locale={locale}
        sessiontoken={sessiontoken}
        projects={projects}
        statusCaptionMap={statusCodes.captionMap}
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onGenerated={() => void periods.reload()}
      />
    </Stack>
  )
}

export default FeePeriodsContent
