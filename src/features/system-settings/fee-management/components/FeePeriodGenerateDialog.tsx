'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { type Dayjs } from 'dayjs'
import { memo, useCallback, useMemo, useState } from 'react'

import type { FeeProjectOption } from '@/features/fees/types'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { formatFeePeriodMonth, getFeePeriodFilterYearOptions, getFeePeriodStatusColor } from '../feePeriod.helpers'
import { FEE_PERIOD_DAY_OPTIONS } from '../feePeriodQuickCreate.actions'
import {
  FEE_PERIOD_DRAFT_INVALID_DATE,
  groupFeePeriodDrafts,
  isValidDateInput,
  type FeePeriodDraftErrors,
  type FeePeriodDraftField,
  type FeePeriodDraftRow
} from '../feePeriodQuickCreate.draft'
import { feeSettingsText } from '../feeSettingsModules'
import { getFeePeriodStatusCaption } from '../hooks/useFeePeriodStatusCodeList'
import { useFeePeriodQuickCreate } from '../hooks/useFeePeriodQuickCreate'

type FeePeriodGenerateDialogProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  sessiontoken?: string
  projects: FeeProjectOption[]
  statusCaptionMap: ReadonlyMap<string, string>
  open: boolean
  onClose: () => void
  /** Called after a successful Batch Save so the list reloads. */
  onGenerated: () => void
}

type Text = (key: string, fallback: string) => string

const ALL_PROJECTS_FILTER = 'all'
const COLUMN_COUNT = 7

const headCellSx = { fontWeight: 700, whiteSpace: 'nowrap' } as const
const dateInputSx = { minWidth: 160 } as const

const DRAFT_DATE_DISPLAY_FORMAT = 'DD/MM/YYYY'
const DRAFT_DATE_VALUE_FORMAT = 'YYYY-MM-DD'

/** Draft yyyy-MM-dd → local calendar Dayjs (no timezone conversion); an incomplete entry stays invalid. */
const toPickerValue = (value: string): Dayjs | null => {
  if (!value) return null
  if (!isValidDateInput(value)) return dayjs(null)

  // ISO date-only string → local midnight of that calendar day (format() gives the same date back).
  return dayjs(value)
}

const fromPickerValue = (value: Dayjs | null) => {
  if (!value) return ''

  return value.isValid() ? value.format(DRAFT_DATE_VALUE_FORMAT) : FEE_PERIOD_DRAFT_INVALID_DATE
}

type DraftRowProps = {
  row: FeePeriodDraftRow
  errors: FeePeriodDraftErrors[string] | undefined
  disabled: boolean
  text: Text
  statusCaption: string
  onChange: (key: string, field: FeePeriodDraftField, value: string) => void
}

const FeePeriodDraftTableRow = memo(({ row, errors, disabled, text, statusCaption, onChange }: DraftRowProps) => {
  const errorText = (field: keyof NonNullable<DraftRowProps['errors']>) => {
    const key = errors?.[field]

    return key ? text(key, key) : undefined
  }

  // Fixed dd/MM/yyyy display and keyboard parsing whatever the OS/browser region; the draft keeps yyyy-MM-dd.
  const dateField = (field: 'from_date' | 'to_date' | 'due_date', label: string) => (
    <DatePicker
      format={DRAFT_DATE_DISPLAY_FORMAT}
      value={toPickerValue(row[field])}
      onChange={value => onChange(row.key, field, fromPickerValue(value))}
      disabled={disabled}
      sx={dateInputSx}
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
          required: true,
          error: Boolean(errors?.[field]),
          helperText: errorText(field),
          inputProps: { 'aria-label': label }
        }
      }}
    />
  )

  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
        <Typography variant='body2' fontWeight={700}>{formatFeePeriodMonth(row.year, row.month)}</Typography>
        <Typography variant='caption' color='text.secondary'>{row.period_code || '-'}</Typography>
        {errors?.identity && (
          <Typography variant='caption' color='error' display='block'>{text(errors.identity, errors.identity)}</Typography>
        )}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', minWidth: 220 }}>
        <TextField
          fullWidth
          size='small'
          required
          value={row.period_name}
          onChange={event => onChange(row.key, 'period_name', event.target.value)}
          error={Boolean(errors?.period_name)}
          helperText={errorText('period_name')}
          disabled={disabled}
          slotProps={{ htmlInput: { 'aria-label': text('field_period_name', 'Period name') } }}
        />
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top' }}>{dateField('from_date', text('field_from_date', 'From date'))}</TableCell>
      <TableCell sx={{ verticalAlign: 'top' }}>{dateField('to_date', text('field_to_date', 'To date'))}</TableCell>
      <TableCell sx={{ verticalAlign: 'top' }}>{dateField('due_date', text('field_due_date', 'Due date'))}</TableCell>
      <TableCell sx={{ verticalAlign: 'top', minWidth: 200 }}>
        <TextField
          fullWidth
          size='small'
          value={row.description}
          onChange={event => onChange(row.key, 'description', event.target.value)}
          disabled={disabled}
          slotProps={{ htmlInput: { 'aria-label': text('field_description', 'Description') } }}
        />
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', pt: 2.5 }}>
        <Chip size='small' variant='tonal' color={getFeePeriodStatusColor(row.status)} label={statusCaption} />
      </TableCell>
    </TableRow>
  )
})

FeePeriodDraftTableRow.displayName = 'FeePeriodDraftTableRow'

const QuickCreateErrorAlert = ({ title, error, executionIdLabel, text }: { title: string; error: WorkflowErrorDetail; executionIdLabel: string; text: Text }) => (
  <WorkflowErrorAlert
    title={title}
    message={error.message}
    workflowId={error.workflowId}
    errorCode={error.errorCode}
    executionId={error.executionId}
    executionIdLabel={executionIdLabel}
    copyLabel={text('copy_label', 'Copy')}
    copiedLabel={text('copied_label', 'Copied')}
    copySuccessMessage={text('copy_error_reference_success', 'Error reference copied')}
    copyFailedMessage={text('copy_error_reference_failed', 'Unable to copy the error reference')}
  />
)

/**
 * Quick create of 12 fee periods in two steps inside the dialog:
 * 1. Setup → preview (WF_BO_GENERATE_QUICK_YEAR_FEE_PERIODS, preview_only: true, nothing stored);
 * 2. Edit the returned periods → Batch Save (WF_BO_BATCH_SAVE_FEE_PERIODS, upsert) after a confirmation.
 * Confirmations are nested MUI dialogs (a SweetAlert on top of the MUI dialog would fight its focus trap).
 */
const FeePeriodGenerateDialog = ({
  dictionary,
  locale,
  sessiontoken,
  projects,
  statusCaptionMap,
  open,
  onClose,
  onGenerated
}: FeePeriodGenerateDialogProps) => {
  const text: Text = useCallback((key, fallback) => feeSettingsText(dictionary, key, fallback), [dictionary])
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const quick = useFeePeriodQuickCreate({ sessiontoken, locale, text, onClose, onSaved: onGenerated })
  const [projectFilter, setProjectFilter] = useState(ALL_PROJECTS_FILTER)
  const { setup, setupErrors, drafts, rowErrors, generating, saving } = quick
  const busy = generating || saving
  const executionIdLabel = dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'
  const yearOptions = useMemo(() => getFeePeriodFilterYearOptions(), [])
  const groups = useMemo(() => groupFeePeriodDrafts(drafts ?? []), [drafts])
  const invalidKeys = Object.keys(rowErrors).filter(key => Object.values(rowErrors[key] ?? {}).some(Boolean))

  const filteredGroups = groups.filter(group => String(group.projectId ?? '') === projectFilter)

  // Invalid rows are always visible so every error can be seen at its row.
  const visibleGroups = invalidKeys.length > 0 || filteredGroups.length === 0 ? groups : filteredGroups

  const showGroupHeaders = groups.length > 1 || setup.applyAllProjects
  const isPreview = quick.step === 'preview' && drafts !== null

  const setupErrorText = (field: keyof typeof setupErrors) => {
    const key = setupErrors[field]

    return key ? text(key, key) : undefined
  }

  const confirmCopy = {
    save: {
      title: text('quick_create_save_confirm_title', 'Save fee periods'),
      message: text('quick_create_save_confirm', 'Save {count} fee period(s)? Existing periods with the same project, year and month will be updated.')
        .replace('{count}', String(drafts?.length ?? 0)),
      action: text('quick_create_save_all', 'Save all')
    },
    'discard-close': {
      title: text('quick_create_discard_title', 'Discard changes'),
      message: text('quick_create_discard_close_confirm', 'Your changes have not been saved. Close and discard them?'),
      action: text('quick_create_discard_action', 'Discard')
    },
    'discard-regenerate': {
      title: text('quick_create_discard_title', 'Discard changes'),
      message: text('quick_create_discard_regenerate_confirm', 'Generating the preview again replaces the changes you made. Continue?'),
      action: text('quick_create_preview_submit', 'Preview fee periods')
    }
  }

  const activeConfirm = quick.confirm ? confirmCopy[quick.confirm] : null

  return (
    <>
      <Dialog
        open={open}
        onClose={() => quick.close()}
        fullWidth
        fullScreen={fullScreen}
        maxWidth={isPreview ? 'xl' : 'sm'}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 2 }}>
          {text('quick_create_title', 'Quick create fee periods')}
          <Stepper activeStep={isPreview ? 1 : 0} sx={{ mt: 2 }}>
            <Step><StepLabel>{text('quick_create_step_setup', 'Setup')}</StepLabel></Step>
            <Step><StepLabel>{text('quick_create_step_preview', 'Preview & edit')}</StepLabel></Step>
          </Stepper>
        </DialogTitle>

        <DialogContent dividers>
          {!isPreview ? (
            <Stack spacing={3}>
              <Typography variant='body2' color='text.secondary'>
                {text('quick_create_description', 'Generates a preview of the 12 monthly fee periods of the selected year. Nothing is saved until you click Save all.')}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={setup.applyAllProjects}
                        onChange={event => quick.updateSetup('applyAllProjects', event.target.checked)}
                        disabled={busy}
                      />
                    )}
                    label={text('quick_create_apply_all_projects', 'Apply to all active projects')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    required={!setup.applyAllProjects}
                    label={text('field_project', 'Project')}
                    value={setup.applyAllProjects ? '' : setup.projectId ?? ''}
                    onChange={event => quick.updateSetup('projectId', event.target.value === '' ? null : Number(event.target.value))}
                    error={Boolean(setupErrors.projectId)}
                    helperText={setupErrorText('projectId')}
                    disabled={busy || setup.applyAllProjects}
                  >
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.code ? `[${project.code}] ${project.name}` : project.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    required
                    label={text('field_year', 'Year')}
                    value={setup.year}
                    onChange={event => quick.updateSetup('year', Number(event.target.value))}
                    disabled={busy}
                  >
                    {yearOptions.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    required
                    label={text('quick_create_from_day', 'Start day of each month')}
                    value={setup.fromDayOfMonth}
                    onChange={event => quick.updateSetup('fromDayOfMonth', Number(event.target.value))}
                    error={Boolean(setupErrors.fromDayOfMonth)}
                    helperText={setupErrorText('fromDayOfMonth')}
                    disabled={busy}
                  >
                    {FEE_PERIOD_DAY_OPTIONS.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    required
                    label={text('quick_create_due_day', 'Due day of each month')}
                    value={setup.dueDayOfMonth}
                    onChange={event => quick.updateSetup('dueDayOfMonth', Number(event.target.value))}
                    error={Boolean(setupErrors.dueDayOfMonth)}
                    helperText={setupErrorText('dueDayOfMonth')}
                    disabled={busy}
                  >
                    {FEE_PERIOD_DAY_OPTIONS.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size='small'
                    label={text('quick_create_prefix', 'Period name prefix')}
                    value={setup.prefix}
                    onChange={event => quick.updateSetup('prefix', event.target.value)}
                    disabled={busy}
                  />
                </Grid>
              </Grid>

              {drafts !== null && (
                <Alert
                  severity='info'
                  action={(
                    <Button color='inherit' size='small' onClick={quick.continueEditing} disabled={busy}>
                      {text('quick_create_continue_editing', 'Continue editing')}
                    </Button>
                  )}
                >
                  {text('quick_create_preview_kept', 'The current preview is kept. Changing a setting requires generating the preview again.')}
                </Alert>
              )}

              {quick.previewError && (
                <QuickCreateErrorAlert
                  title={text('quick_create_preview_failed', 'Unable to generate the fee period preview.')}
                  error={quick.previewError}
                  executionIdLabel={executionIdLabel}
                  text={text}
                />
              )}
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent='space-between'>
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                  <Chip
                    color='primary'
                    variant='tonal'
                    label={text('quick_create_total', '{count} fee period(s)').replace('{count}', String(drafts.length))}
                  />
                  {showGroupHeaders && (
                    <Chip
                      variant='outlined'
                      label={text('quick_create_total_projects', '{count} project(s)').replace('{count}', String(groups.length))}
                    />
                  )}
                  <Typography variant='body2' color='text.secondary'>
                    {text('quick_create_preview_hint', 'Preview only — nothing is saved until you click Save all.')}
                  </Typography>
                </Stack>
                {groups.length > 1 && (
                  <TextField
                    select
                    size='small'
                    label={text('field_project', 'Project')}
                    value={projectFilter}
                    onChange={event => setProjectFilter(event.target.value)}
                    disabled={saving}
                    sx={{ minWidth: 260 }}
                  >
                    <MenuItem value={ALL_PROJECTS_FILTER}>{text('filter_all_projects', 'All projects')}</MenuItem>
                    {groups.map(group => (
                      <MenuItem key={String(group.projectId)} value={String(group.projectId ?? '')}>
                        {`${group.label} (${group.rows.length})`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>

              {quick.saveNotice && <Alert severity='error'>{quick.saveNotice}</Alert>}

              {quick.saveError && (
                <QuickCreateErrorAlert
                  title={text('quick_create_save_failed', 'Unable to save the fee periods.')}
                  error={quick.saveError}
                  executionIdLabel={executionIdLabel}
                  text={text}
                />
              )}

              {drafts.length === 0 ? (
                <Alert severity='info'>{text('quick_create_preview_empty', 'No fee period was generated for these settings.')}</Alert>
              ) : (
                <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2, overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 1100 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headCellSx}>{text('field_period', 'Period')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_period_name', 'Period name')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_from_date', 'From date')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_to_date', 'To date')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_due_date', 'Due date')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_description', 'Description')}</TableCell>
                        <TableCell sx={headCellSx}>{text('field_status', 'Status')}</TableCell>
                      </TableRow>
                    </TableHead>
                    {visibleGroups.map(group => (
                      <TableBody key={String(group.projectId)}>
                        {showGroupHeaders && (
                          <TableRow>
                            <TableCell colSpan={COLUMN_COUNT} sx={{ bgcolor: 'action.hover', fontWeight: 700 }}>
                              {group.label}
                              <Typography component='span' variant='body2' color='text.secondary' sx={{ ml: 1 }}>
                                {text('quick_create_total', '{count} fee period(s)').replace('{count}', String(group.rows.length))}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {group.rows.map(row => (
                          <FeePeriodDraftTableRow
                            key={row.key}
                            row={row}
                            errors={rowErrors[row.key]}
                            disabled={saving}
                            text={text}
                            statusCaption={getFeePeriodStatusCaption(statusCaptionMap, row.status)}
                            onChange={quick.updateRow}
                          />
                        ))}
                      </TableBody>
                    ))}
                  </Table>
                </TableContainer>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, flexWrap: 'wrap' }}>
          {isPreview && (
            <Button variant='text' startIcon={<ArrowBackRounded />} onClick={() => quick.setStep('setup')} disabled={busy} sx={{ mr: 'auto' }}>
              {text('back', 'Back')}
            </Button>
          )}
          <Button variant='outlined' onClick={() => quick.close()} disabled={busy}>
            {text('cancel', 'Cancel')}
          </Button>
          {isPreview ? (
            <Button
              variant='contained'
              startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <SaveRounded />}
              onClick={quick.requestSave}
              disabled={busy || drafts.length === 0}
            >
              {saving ? text('saving', 'Saving...') : text('quick_create_save_all', 'Save all')}
            </Button>
          ) : (
            <Button
              variant='contained'
              startIcon={generating ? <CircularProgress size={16} color='inherit' /> : <VisibilityRounded />}
              onClick={quick.requestPreview}
              disabled={busy}
            >
              {generating ? text('quick_create_previewing', 'Generating preview...') : text('quick_create_preview_submit', 'Preview fee periods')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={open && Boolean(activeConfirm)} onClose={() => quick.setConfirm(null)} maxWidth='xs' fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{activeConfirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{activeConfirm?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => quick.setConfirm(null)}>{text('cancel', 'Cancel')}</Button>
          <Button variant='contained' color='warning' onClick={quick.confirmAction}>{activeConfirm?.action}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default FeePeriodGenerateDialog
