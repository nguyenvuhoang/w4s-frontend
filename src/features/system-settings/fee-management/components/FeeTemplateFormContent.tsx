'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import MarkEmailReadRounded from '@mui/icons-material/MarkEmailReadRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import NextLink from 'next/link'
import type { Session } from 'next-auth'
import { useRef, useState } from 'react'

import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  FEE_TEMPLATE_GROUP,
  FEE_TEMPLATE_LANGUAGES,
  FEE_TEMPLATE_LENGTH_GUIDE,
  FEE_TEMPLATE_TOKEN,
  FEE_TEMPLATE_VARIABLES,
  feeTemplatesHref,
  type FeeTemplateLanguage
} from '../feeTemplate.constants'
import type { FeeTemplateItem } from '../feeTemplate.service'
import { feeSettingsHref, feeSettingsText } from '../feeSettingsModules'
import { useFeeTemplateForm } from '../hooks/useFeeTemplateForm'
import {
  getNotificationTemplateCodeListCaption,
  getNotificationTemplateStatusCaption,
  NOTIFICATION_TEMPLATE_ALL_CHANNEL,
  useNotificationTemplateCodeLists
} from '../hooks/useNotificationTemplateCodeLists'
import { unknownFeeTemplateVariables } from '../feeTemplate.preview'
import FeeTemplatePreview from './FeeTemplatePreview'

type FeeTemplateFormContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  session: Session | null
  mode: 'create' | 'edit'
  /** Edit: the template; create: optional clone source. */
  template?: FeeTemplateItem | null
  isClone?: boolean
  notFound?: boolean
  loadError?: WorkflowErrorDetail | null
}

type ActiveField = { field: 'subjects' | 'bodies'; language: FeeTemplateLanguage }

const counterText = (length: number, guide?: number) => (guide ? `${length}/${guide}` : String(length))

/** Create / edit page with the template builder (variables, channel-specific editor, preview). */
const FeeTemplateFormContent = ({
  dictionary,
  locale,
  session,
  mode,
  template = null,
  isClone = false,
  notFound = false,
  loadError = null
}: FeeTemplateFormContentProps) => {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const form = useFeeTemplateForm({ dictionary, locale, sessiontoken: session?.user?.token ?? undefined, mode, template })
  const { values, errors } = form
  const codeLists = useNotificationTemplateCodeLists(locale)
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({})
  const [activeField, setActiveField] = useState<ActiveField>({ field: 'bodies', language: 'vi' })
  const isEmail = values.channel === 'EMAIL'
  const isSms = values.channel === 'SMS'
  const isPush = values.channel === 'PUSH_NOTI'
  const canEdit = !form.isEdit || Boolean(template)
  const unknownVariables = unknownFeeTemplateVariables(...Object.values(values.subjects), ...Object.values(values.bodies))
  const title = form.isEdit
    ? text('template_edit_title', 'Edit template')
    : isClone ? text('template_clone_title', 'Clone template') : text('template_create_title', 'New template')

  const refKey = (field: ActiveField['field'], language: FeeTemplateLanguage) => `${field}.${language}`

  /** Inserts the token at the cursor of the last focused subject/content field (SMS has no subject). */
  const insertVariable = (key: string) => {
    const target: ActiveField = isSms && activeField.field === 'subjects' ? { field: 'bodies', language: activeField.language } : activeField
    const element = inputRefs.current[refKey(target.field, target.language)]
    const current = values[target.field][target.language]
    const token = FEE_TEMPLATE_TOKEN(key)
    const start = element?.selectionStart ?? current.length
    const end = element?.selectionEnd ?? current.length

    form.setLocalized(target.field, target.language, `${current.slice(0, start)}${token}${current.slice(end)}`)

    requestAnimationFrame(() => {
      element?.focus()
      element?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const subjectField = (language: FeeTemplateLanguage) => (
    <TextField
      fullWidth
      size='small'
      required={language === 'vi'}
      label={language === 'vi' ? text('field_subject_vi', 'Subject (Vietnamese)') : text('field_subject_en', 'Subject (English)')}
      value={values.subjects[language]}
      onChange={event => form.setLocalized('subjects', language, event.target.value)}
      onFocus={() => setActiveField({ field: 'subjects', language })}
      inputRef={element => { inputRefs.current[refKey('subjects', language)] = element }}
      error={language === 'vi' && Boolean(errors.subject_vi)}
      helperText={(language === 'vi' && errors.subject_vi) || (isPush ? counterText(values.subjects[language].length, FEE_TEMPLATE_LENGTH_GUIDE.PUSH_NOTI_SUBJECT) : undefined)}
    />
  )

  const bodyField = (language: FeeTemplateLanguage) => {
    const length = values.bodies[language].length
    const helper = isSms
      ? `${length} · ${text('sms_segments', 'SMS segments')}: ${Math.max(Math.ceil(length / FEE_TEMPLATE_LENGTH_GUIDE.SMS_SEGMENT), 1)}`
      : isPush ? counterText(length, FEE_TEMPLATE_LENGTH_GUIDE.PUSH_NOTI_BODY) : undefined

    return (
      <TextField
        fullWidth
        multiline
        minRows={isEmail ? 10 : 4}
        maxRows={isEmail ? 24 : 12}
        required={language === 'vi'}
        label={`${isEmail ? text('field_body_html', 'Content (HTML)') : text('field_body_text', 'Content')} (${language.toUpperCase()})`}
        value={values.bodies[language]}
        onChange={event => form.setLocalized('bodies', language, event.target.value)}
        onFocus={() => setActiveField({ field: 'bodies', language })}
        inputRef={element => { inputRefs.current[refKey('bodies', language)] = element }}
        error={language === 'vi' && Boolean(errors.body_vi)}
        helperText={(language === 'vi' && errors.body_vi) || helper}
        slotProps={{ htmlInput: { style: { fontFamily: isEmail ? 'monospace' : undefined, fontSize: 13 } } }}
      />
    )
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {dictionary.system_settings_modules?.breadcrumb_system_settings ?? 'System Settings'}
          </MuiLink>
          <MuiLink component={NextLink} href={feeSettingsHref(locale)} underline='hover'>{text('hub_title', 'Fee Management')}</MuiLink>
          <MuiLink component={NextLink} href={feeTemplatesHref(locale)} underline='hover'>{text('module_fee_templates_title', 'Fee templates')}</MuiLink>
          <Typography color='text.primary'>{title}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
          <Stack direction='row' gap={1.5} alignItems='flex-start'>
            <MarkEmailReadRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
            <Box>
              <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
              <Typography variant='body1' color='text.secondary'>
                {text('template_form_description', 'Fee notification template (group FEE).')}
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
            <Button variant='outlined' startIcon={<ArrowBackRounded />} onClick={form.goBack} disabled={form.saving}>{text('cancel', 'Cancel')}</Button>
            {canEdit && (
              <Button
                variant='contained'
                startIcon={form.saving ? <CircularProgress size={16} color='inherit' /> : <SaveRounded />}
                onClick={() => void form.submit()}
                disabled={form.saving || codeLists.isLoading}
              >
                {form.saving ? text('saving', 'Saving...') : text('save', 'Save')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      {notFound && <Alert severity='warning' variant='outlined' sx={{ borderRadius: 2 }}>{text('template_not_found', 'The template does not exist or has been deleted.')}</Alert>}
      {isClone && template && (
        <Alert severity='info' variant='outlined' sx={{ borderRadius: 2 }}>
          {text('template_clone_hint', 'Copied from {code}. Enter a new template code, check the content and press Save.').replace('{code}', template.template_code)}
        </Alert>
      )}
      {loadError && (
        <WorkflowErrorAlert
          title={text('template_detail_load_failed', 'Unable to load the template.')}
          message={loadError.message}
          workflowId={loadError.workflowId}
          errorCode={loadError.errorCode}
          executionId={loadError.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
        />
      )}
      {codeLists.error && <Alert severity='error' variant='outlined'>{text('template_codelist_load_failed', 'Unable to load notification template options.')}</Alert>}
      {form.submitError && (
        <WorkflowErrorAlert
          title={form.isEdit ? text('template_update_failed', 'Unable to update the template.') : text('template_create_failed', 'Unable to create the template.')}
          message={form.submitError.message}
          workflowId={form.submitError.workflowId}
          errorCode={form.submitError.errorCode}
          executionId={form.submitError.executionId}
          executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
        />
      )}

      {canEdit && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 7 }} sx={{ minWidth: 0 }}>
            <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Stack spacing={2.5}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>{text('template_info_section', 'Template information')}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size='small'
                      label={text('field_template_group', 'Template group')}
                      value={getNotificationTemplateCodeListCaption(codeLists.groupCaptionMap, FEE_TEMPLATE_GROUP)}
                      disabled
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size='small'
                      required
                      label={text('field_template_code', 'Template code')}
                      value={values.template_code}
                      onChange={event => form.setField('template_code', event.target.value)}
                      error={Boolean(errors.template_code)}
                      helperText={errors.template_code}
                      slotProps={{ htmlInput: { maxLength: 100 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      size='small'
                      required
                      label={text('field_channel', 'Channel')}
                      value={values.channel}
                      onChange={event => form.setField('channel', String(event.target.value))}
                      disabled={codeLists.isLoading}
                      error={Boolean(errors.channel)}
                      helperText={errors.channel}
                    >
                      {codeLists.channelOptions
                        .filter(option => option.value !== NOTIFICATION_TEMPLATE_ALL_CHANNEL)
                        .map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      size='small'
                      required
                      label={text('field_template_name', 'Template name')}
                      value={values.template_name}
                      onChange={event => form.setField('template_name', event.target.value)}
                      error={Boolean(errors.template_name)}
                      helperText={errors.template_name}
                    />
                  </Grid>
                  {form.isEdit && template?.status && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size='small'
                        disabled
                        label={text('field_status', 'Status')}
                        value={getNotificationTemplateStatusCaption(codeLists.statusCaptionMap, template.status)}
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={<Switch checked={values.is_default} onChange={event => form.setField('is_default', event.target.checked)} />}
                      label={text('field_is_default', 'Default template')}
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>{text('variables_title', 'Dynamic variables')}</Typography>
                  <Stack direction='row' flexWrap='wrap' gap={1}>
                    {FEE_TEMPLATE_VARIABLES.map(variable => (
                      <Chip
                        key={variable.key}
                        size='small'
                        variant='outlined'
                        color='primary'
                        label={`${text(`variable_${variable.key}`, variable.key)} · ${FEE_TEMPLATE_TOKEN(variable.key)}`}
                        // Keep the focus/selection of the edited field when the chip is pressed.
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => insertVariable(variable.key)}
                      />
                    ))}
                  </Stack>
                  <Typography variant='caption' color='text.secondary'>
                    {text('variables_hint', 'Click a variable to insert it at the cursor position.')}
                    {!isEmail && ` ${text('variables_html_hint', 'TableBody / PaymentQr are rendered as text outside e-mails.')}`}
                  </Typography>
                </Box>

                {isEmail && (
                  <Stack spacing={1.5}>
                    <Alert severity='info'>{text('email_builder_contract_hint', '')}</Alert>
                    <Stack direction='row' gap={1} flexWrap='wrap'>
                      <Button variant='outlined' onClick={form.insertEmailStarter} disabled={Boolean(values.bodies.vi.trim() || values.bodies.en.trim()) || form.saving}>{text('email_insert_starter', '')}</Button>
                      <Button variant='outlined' onClick={form.combineEmailLanguages} disabled={!values.bodies.vi.trim() || !values.bodies.en.trim() || values.bodies.vi === values.bodies.en || form.saving}>{text('email_combine_languages', '')}</Button>
                    </Stack>
                    <Typography variant='caption' color='text.secondary'>{text('email_combine_hint', '')}</Typography>
                    <Typography variant='caption' color='text.secondary'>{text('email_starter_hint', '')}</Typography>
                  </Stack>
                )}
                {unknownVariables.length > 0 && <Alert severity='warning'>{text('email_unknown_variables', '').replace('{variables}', unknownVariables.join(', '))}</Alert>}

                {FEE_TEMPLATE_LANGUAGES.map(language => (
                  <Stack key={language} spacing={2}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                      {language === 'vi' ? text('content_vi_section', 'Vietnamese content') : text('content_en_section', 'English content')}
                    </Typography>
                    {!isSms && subjectField(language)}
                    {bodyField(language)}
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }} sx={{ minWidth: 0 }}>
            <Paper variant='outlined' sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, position: { lg: 'sticky' }, top: { lg: 16 } }}>
              <FeeTemplatePreview dictionary={dictionary} channel={values.channel} subjects={values.subjects} bodies={values.bodies} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </Stack>
  )
}

export default FeeTemplateFormContent
