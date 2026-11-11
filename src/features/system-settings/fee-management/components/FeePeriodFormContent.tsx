'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'

import type { FeePeriodItem, FeeProjectOption } from '@/features/fees/types'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  buildFeePeriodName,
  FEE_PERIOD_MONTHS,
  feePeriodsHref,
  getFeePeriodFilterYearOptions
} from '../feePeriod.helpers'
import { feeSettingsHref, feeSettingsText } from '../feeSettingsModules'
import { useFeePeriodForm } from '../hooks/useFeePeriodForm'
import { useFeePeriodStatusCodeList } from '../hooks/useFeePeriodStatusCodeList'

type FeePeriodFormContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  mode: 'create' | 'edit'
  period?: FeePeriodItem | null
  notFound?: boolean
  loadError?: WorkflowErrorDetail | null
  projects: FeeProjectOption[]
  projectsError?: WorkflowErrorDetail | null
}

const errorAlertLabels = (dictionary: SystemSettingsDictionary) => ({
  executionIdLabel: dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'
})

/** Create / edit page of a fee period (separate page, not a modal). */
const FeePeriodFormContent = ({
  dictionary,
  locale,
  session,
  mode,
  period = null,
  notFound = false,
  loadError = null,
  projects,
  projectsError = null
}: FeePeriodFormContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const form = useFeePeriodForm({ dictionary, locale, sessiontoken: session?.user?.token ?? undefined, mode, period })
  const statusCodes = useFeePeriodStatusCodeList(locale)
  const { values, errors } = form
  const title = form.isEdit ? text('period_edit_title', 'Edit fee period') : text('period_create_title', 'Add fee period')
  const canEdit = !form.isEdit || Boolean(period)

  // Keep a stored status selectable even when CodeList hides it.
  const statusOptions = values.status && !statusCodes.options.some(option => option.value === values.status)
    ? [{ value: values.status, label: statusCodes.captionMap.get(values.status.toUpperCase()) ?? values.status }, ...statusCodes.options]
    : statusCodes.options

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
          <MuiLink component={NextLink} href={feePeriodsHref(locale)} underline='hover'>
            {text('module_fee_periods_title', 'Fee periods')}
          </MuiLink>
          <Typography color='text.primary'>{title}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
          <Stack direction='row' gap={1.5} alignItems='flex-start'>
            <CalendarMonthRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
              <Typography variant='body1' color='text.secondary'>
                {form.isEdit
                  ? text('period_edit_description', 'Update the fee period information.')
                  : text('period_create_description', 'Create a fee period for a project.')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
            <Button variant='outlined' startIcon={<ArrowBackRounded />} onClick={form.goBack} disabled={form.saving}>
              {text('cancel', 'Cancel')}
            </Button>
            {canEdit && (
              <Button
                variant='contained'
                startIcon={form.saving ? <CircularProgress size={16} color='inherit' /> : <SaveRounded />}
                onClick={() => void form.submit()}
                disabled={form.saving}
              >
                {form.saving ? text('saving', 'Saving...') : text('save', 'Save')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      {notFound && (
        <Alert severity='warning' variant='outlined' sx={{ borderRadius: 2 }}>
          {text('period_not_found', 'The fee period does not exist or has been deleted.')}
        </Alert>
      )}

      {loadError && (
        <WorkflowErrorAlert
          title={text('period_detail_load_failed', 'Unable to load the fee period.')}
          message={loadError.message}
          workflowId={loadError.workflowId}
          errorCode={loadError.errorCode}
          executionId={loadError.executionId}
          {...errorAlertLabels(dictionary)}
        />
      )}

      {projectsError && (
        <WorkflowErrorAlert
          title={text('projects_load_failed', 'Unable to load projects.')}
          message={projectsError.message}
          workflowId={projectsError.workflowId}
          errorCode={projectsError.errorCode}
          executionId={projectsError.executionId}
          {...errorAlertLabels(dictionary)}
        />
      )}

      {form.submitError && (
        <WorkflowErrorAlert
          title={form.isEdit ? text('period_update_failed', 'Unable to update the fee period.') : text('period_create_failed', 'Unable to create the fee period.')}
          message={form.submitError.message}
          workflowId={form.submitError.workflowId}
          errorCode={form.submitError.errorCode}
          executionId={form.submitError.executionId}
          {...errorAlertLabels(dictionary)}
        />
      )}

      {canEdit && (
        <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
          <Stack spacing={3}>
            <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
              {text('period_info_section', 'Fee period information')}
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  required
                  label={text('field_period_code', 'Period code')}
                  value={values.period_code}
                  onChange={event => form.updateValue('period_code', event.target.value)}
                  error={Boolean(errors.period_code)}
                  helperText={errors.period_code}
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  required
                  label={text('field_project', 'Project')}
                  value={values.project_id ?? ''}
                  onChange={event => form.updateValue('project_id', event.target.value === '' ? null : Number(event.target.value))}
                  error={Boolean(errors.project_id)}
                  // The project of an existing period is kept: moving a period between projects is not offered.
                  disabled={form.isEdit}
                  helperText={errors.project_id ?? (form.isEdit ? text('project_locked_hint', 'The project of an existing period cannot be changed.') : undefined)}
                >
                  {values.project_id && !projects.some(project => project.id === values.project_id) && (
                    <MenuItem value={values.project_id}>
                      {text('project_unknown', 'Project #{id}').replace('{id}', String(values.project_id))}
                    </MenuItem>
                  )}
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.code ? `[${project.code}] ${project.name}` : project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  required
                  label={text('field_year', 'Year')}
                  value={values.year ?? ''}
                  onChange={event => form.updateValue('year', event.target.value === '' ? null : Number(event.target.value))}
                  error={Boolean(errors.year)}
                  helperText={errors.year}
                >
                  {getFeePeriodFilterYearOptions().map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  required
                  label={text('field_month_only', 'Month')}
                  value={values.month ?? ''}
                  onChange={event => form.updateValue('month', event.target.value === '' ? null : Number(event.target.value))}
                  error={Boolean(errors.month)}
                  helperText={errors.month}
                >
                  {FEE_PERIOD_MONTHS.map(month => (
                    <MenuItem key={month} value={month}>
                      {text('filter_month_option', 'Month {month}').replace('{month}', String(month))}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  required
                  type='date'
                  label={text('field_due_date', 'Due date')}
                  value={values.due_date}
                  onChange={event => form.updateValue('due_date', event.target.value)}
                  error={Boolean(errors.due_date)}
                  helperText={errors.due_date}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              {form.isEdit && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    required
                    label={text('field_status', 'Status')}
                    value={values.status}
                    onChange={event => form.updateValue('status', String(event.target.value))}
                    error={Boolean(errors.status)}
                    helperText={errors.status}
                    disabled={statusCodes.isLoading}
                  >
                    {statusOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size='small'
                  label={text('field_period_name', 'Period name')}
                  value={buildFeePeriodName(text('period_name_generated', 'Fee period for {MM}/{year}'), values.year, values.month)}
                  disabled
                  helperText={text('period_name_auto_hint', 'Generated from the month and year.')}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

export default FeePeriodFormContent
