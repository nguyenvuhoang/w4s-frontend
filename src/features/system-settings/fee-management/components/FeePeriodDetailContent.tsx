'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Grid,
  Link as MuiLink,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

import type { FeePeriodItem, FeeProjectOption } from '@/features/fees/types'
import { useRouter } from '@shared/hooks/useRouter'
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
import { feeSettingsHref, feeSettingsText } from '../feeSettingsModules'
import { useFeePeriodDelete } from '../hooks/useFeePeriodDelete'
import { getFeePeriodStatusCaption, useFeePeriodStatusCodeList } from '../hooks/useFeePeriodStatusCodeList'

type FeePeriodDetailContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  period: FeePeriodItem | null
  notFound: boolean
  error: WorkflowErrorDetail | null
  projects: FeeProjectOption[]
}

const DetailField = ({ label, children }: { label: string; children: ReactNode }) => (
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Stack spacing={0.75}>
      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>{children}</Box>
    </Stack>
  </Grid>
)

/** Fee period detail (WF_BO_GET_FEE_PERIOD_BY_ID): only the fields the backend fills are shown. */
const FeePeriodDetailContent = ({
  dictionary,
  locale,
  session,
  period,
  notFound,
  error,
  projects
}: FeePeriodDetailContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const router = useRouter()
  const statusCodes = useFeePeriodStatusCodeList(locale)
  const listHref = feePeriodsHref(locale)
  const { deletePeriod, deletingId } = useFeePeriodDelete({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    onDeleted: () => {
      router.push(listHref)
      router.refresh()
    }
  })

  const projectName = (projectId: number | null) => {
    if (!projectId) return '-'

    return projects.find(project => project.id === projectId)?.name
      ?? text('project_unknown', 'Project #{id}').replace('{id}', String(projectId))
  }

  const periodName = period
    ? buildFeePeriodName(text('period_name_generated', 'Fee period for {MM}/{year}'), period.year, period.month)
    : ''

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {dictionary.system_settings_modules?.breadcrumb_system_settings ?? 'System Settings'}
          </MuiLink>
          <MuiLink component={NextLink} href={feeSettingsHref(locale)} underline='hover'>
            {text('hub_title', 'Fee Management')}
          </MuiLink>
          <MuiLink component={NextLink} href={listHref} underline='hover'>
            {text('module_fee_periods_title', 'Fee periods')}
          </MuiLink>
          <Typography color='text.primary'>{period?.period_code || text('period_detail_title', 'Fee period detail')}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
          <Stack direction='row' gap={1.5} alignItems='flex-start'>
            <CalendarMonthRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
                {text('period_detail_title', 'Fee period detail')}
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                {text('period_detail_description', 'Fee period information and available actions.')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
            <Button component={NextLink} href={listHref} variant='outlined' startIcon={<ArrowBackRounded />}>
              {text('back', 'Back')}
            </Button>
            {period?.id && (
              <>
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<DeleteOutlineRounded />}
                  disabled={deletingId === period.id}
                  onClick={() => deletePeriod(period)}
                >
                  {deletingId === period.id ? text('deleting', 'Deleting...') : text('delete', 'Delete')}
                </Button>
                <Button component={NextLink} href={feePeriodsHref(locale, `/${period.id}/edit`)} variant='contained' startIcon={<EditRounded />}>
                  {text('edit', 'Edit')}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Stack>

      {error && !notFound && (
        <WorkflowErrorAlert
          title={text('period_detail_load_failed', 'Unable to load the fee period.')}
          message={error.message}
          workflowId={error.workflowId}
          errorCode={error.errorCode}
          executionId={error.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
          retryLabel={dictionary.common?.retry ?? 'Retry'}
          onRetry={() => router.refresh()}
        />
      )}

      {notFound && (
        <Alert severity='warning' variant='outlined' sx={{ borderRadius: 2 }}>
          {text('period_not_found', 'The fee period does not exist or has been deleted.')}
        </Alert>
      )}

      {period && (
        <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' gap={2}>
              <Stack spacing={0.5}>
                <Typography variant='h5' sx={{ fontWeight: 800, color: 'primary.main' }}>{periodName}</Typography>
                <Typography variant='body2' color='text.secondary'>{period.period_code || '-'}</Typography>
              </Stack>
              {period.status && (
                <Chip
                  size='small'
                  variant='outlined'
                  color={getFeePeriodStatusColor(period.status)}
                  label={getFeePeriodStatusCaption(statusCodes.captionMap, period.status)}
                  sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                />
              )}
            </Stack>

            <Divider />

            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              {text('period_info_section', 'Fee period information')}
            </Typography>

            <Grid container spacing={3}>
              <DetailField label={text('field_period_code', 'Period code')}>
                <Typography sx={{ fontWeight: 700 }}>{period.period_code || '-'}</Typography>
              </DetailField>
              <DetailField label={text('field_project', 'Project')}>
                <Typography>{projectName(period.project_id)}</Typography>
              </DetailField>
              <DetailField label={text('field_period', 'Period')}>
                <Typography>{formatFeePeriodMonth(period.year, period.month)}</Typography>
              </DetailField>
              <DetailField label={text('field_year', 'Year')}>
                <Typography>{period.year ?? '-'}</Typography>
              </DetailField>
              <DetailField label={text('field_month_only', 'Month')}>
                <Typography>{period.month ?? '-'}</Typography>
              </DetailField>
              <DetailField label={text('field_period_name', 'Period name')}>
                <Typography>{periodName}</Typography>
              </DetailField>
              <DetailField label={text('field_due_date', 'Due date')}>
                <Typography>{formatFeePeriodDueDate(period.due_date)}</Typography>
              </DetailField>
              <DetailField label={text('field_status', 'Status')}>
                <Typography>{getFeePeriodStatusCaption(statusCodes.captionMap, period.status)}</Typography>
              </DetailField>
            </Grid>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

export default FeePeriodDetailContent
