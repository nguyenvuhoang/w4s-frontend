'use client'

import { useRef, useState } from 'react'

import dynamic from 'next/dynamic'

import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material'

import type { Locale } from '@/configs/i18n'

import { projectCommonText, projectText, type ProjectDictionary } from '../projectListHelpers'
import ProjectNotificationTemplatePreview from './ProjectNotificationTemplatePreview'
import {
  findLostPlaceholders,
  insertAtSelection,
  templateChannelOptions,
  templateStatusOptions,
  toTemplateForm,
  validateTemplateForm
} from './projectNotificationTemplateHelpers'
import type {
  NotificationTemplateParameter,
  ProjectNotificationTemplate,
  ProjectNotificationTemplateForm,
  ProjectNotificationTemplateFormErrors
} from './projectNotificationTemplateTypes'
import { templateChannelLabel, templateStatusLabel } from './projectNotificationTemplateLabels'

const AnnouncementRichTextEditor = dynamic(() => import('@/features/announcement/components/AnnouncementRichTextEditor'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={320} />
})

type InsertTarget = 'subject' | 'body'
type BodyMode = 'rich' | 'html'

type Props = {
  dictionary: ProjectDictionary
  locale: Locale
  template: ProjectNotificationTemplate
  projectName: string
  parameters: NotificationTemplateParameter[]
  parametersLoading: boolean
  parametersError: string | null
  onRetryParameters: () => void
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSave: (form: ProjectNotificationTemplateForm) => void
}

/**
 * Editor of one template (project override or global template). The form state lives here, so a failed save
 * keeps everything that was typed; the parent closes the dialog only after a successful save.
 */
const ProjectNotificationTemplateEditorDialog = ({
  dictionary,
  locale,
  template,
  projectName,
  parameters,
  parametersLoading,
  parametersError,
  onRetryParameters,
  saving,
  saveError,
  onCancel,
  onSave
}: Props) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)

  const [form, setForm] = useState<ProjectNotificationTemplateForm>(() => toTemplateForm(template))
  const [errors, setErrors] = useState<ProjectNotificationTemplateFormErrors>({})
  const [bodyMode, setBodyMode] = useState<BodyMode>('rich')
  const [insertTarget, setInsertTarget] = useState<InsertTarget>('body')
  const [richLostPlaceholders, setRichLostPlaceholders] = useState<string[]>([])

  const subjectRef = useRef<HTMLInputElement | null>(null)
  const htmlRef = useRef<HTMLTextAreaElement | null>(null)
  const richEditorRef = useRef<any>(null)
  const bodyRef = useRef(form.body_html)

  bodyRef.current = form.body_html

  const update = <K extends keyof ProjectNotificationTemplateForm>(key: K, value: ProjectNotificationTemplateForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    if (key in errors) setErrors(current => ({ ...current, [key]: undefined }))
  }

  const insertIntoField = (element: HTMLInputElement | HTMLTextAreaElement | null, key: 'subject' | 'body_html', placeholder: string) => {
    const current = form[key]
    const { value, caret } = insertAtSelection(current, placeholder, element?.selectionStart, element?.selectionEnd)

    update(key, value)
    requestAnimationFrame(() => {
      element?.focus()
      element?.setSelectionRange(caret, caret)
    })
  }

  const insertPlaceholder = (placeholder: string) => {
    if (insertTarget === 'subject') {
      insertIntoField(subjectRef.current, 'subject', placeholder)

      return
    }

    if (bodyMode === 'html') {
      insertIntoField(htmlRef.current, 'body_html', placeholder)

      return
    }

    const editor = richEditorRef.current

    if (!editor) return

    editor.model.change((writer: any) => {
      editor.model.insertContent(writer.createText(placeholder))
    })
    editor.editing.view.focus()
  }

  const changeBodyMode = (next: BodyMode | null) => {
    if (!next || next === bodyMode) return

    // The body is kept in the form state: the rich editor is re-created from it, the HTML source shows it as is.
    richEditorRef.current = null
    setRichLostPlaceholders([])
    setBodyMode(next)
    setInsertTarget('body')
  }

  /**
   * CKEditor normalizes the HTML it loads. When that normalization would drop a placeholder, the visual editor is
   * left before any change reaches the form (onChange has not fired yet) and the HTML source is kept as is.
   */
  const handleRichReady = (editor: any) => {
    const lost = findLostPlaceholders(bodyRef.current, editor.getData())

    if (lost.length > 0) {
      richEditorRef.current = null
      setRichLostPlaceholders(lost)
      setBodyMode('html')

      return
    }

    richEditorRef.current = editor
  }

  const submit = () => {
    if (saving) return

    const nextErrors = validateTemplateForm(form, { required: t('notificationTemplateRequired', 'This field is required.') })

    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    onSave(form)
  }

  const channelOptions = templateChannelOptions(template.channel)
  const statusOptions = templateStatusOptions(template.status)

  return (
    <Dialog
      open
      onClose={saving ? undefined : onCancel}
      maxWidth={false}
      fullWidth
      fullScreen={fullScreen}
      scroll="paper"
      // Wide workspace; header and footer stay fixed, only DialogContent scrolls.
      slotProps={{ paper: { sx: fullScreen ? undefined : { width: '96vw', maxWidth: 1600, maxHeight: '94vh', m: 0 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('notificationTemplateEditTitle', 'Edit notification template')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            {template.template_name} · {template.template_code}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowX: 'hidden' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5.4 }} sx={{ minWidth: 0 }}>
            <Stack spacing={2.25}>
              {!template.is_customized && (
                <Alert severity="info">
                  {t('notificationTemplateGlobalEditNotice', 'This is a system template. Saving creates a configuration for this project only; the system template is not changed.')}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label={t('notificationTemplateCode', 'Template code')} value={form.template_code} slotProps={{ input: { readOnly: true } }} disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label={t('notificationTemplateGroup', 'Template group')} value={form.template_group} slotProps={{ input: { readOnly: true } }} disabled />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label={t('notificationTemplateName', 'Template name')}
                    value={form.template_name}
                    error={Boolean(errors.template_name)}
                    helperText={errors.template_name}
                    disabled={saving}
                    onChange={event => update('template_name', event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, lg: 6, xl: 4 }}>
                  <TextField select fullWidth size="small" label={t('notificationTemplateChannel', 'Channel')} value={form.channel} disabled={saving} onChange={event => update('channel', event.target.value)}>
                    {channelOptions.map(option => (
                      <MenuItem key={option} value={option}>{templateChannelLabel(dictionary, option)}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, lg: 6, xl: 4 }}>
                  <TextField select fullWidth size="small" label={t('notificationTemplateStatus', 'Status')} value={form.status} disabled={saving} onChange={event => update('status', event.target.value)}>
                    {statusOptions.map(option => (
                      <MenuItem key={option} value={option}>{templateStatusLabel(dictionary, option)}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, lg: 12, xl: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={<Switch checked={form.is_default} disabled={saving} onChange={event => update('is_default', event.target.checked)} />}
                    label={t('notificationTemplateIsDefault', 'Default template')}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                required
                size="small"
                label={t('notificationTemplateSubjectLabel', 'Subject')}
                value={form.subject}
                inputRef={subjectRef}
                error={Boolean(errors.subject)}
                helperText={errors.subject ?? t('notificationTemplateSubjectHelper', 'Used as the Email subject and the mobile push banner.')}
                disabled={saving}
                onFocus={() => setInsertTarget('subject')}
                onChange={event => update('subject', event.target.value)}
              />

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{t('notificationTemplateParameters', 'Insert parameter')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('notificationTemplateInsertInto', 'Insert into')}: {insertTarget === 'subject' ? t('notificationTemplateSubjectLabel', 'Subject') : t('notificationTemplateBody', 'Body')}
                  </Typography>
                </Stack>
                {parametersLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">{t('notificationTemplateParametersLoading', 'Loading parameters...')}</Typography>
                  </Stack>
                ) : parametersError ? (
                  <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetryParameters}>{projectCommonText(dictionary, 'retry', 'Retry')}</Button>}>
                    {parametersError}
                  </Alert>
                ) : parameters.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t('notificationTemplateParametersEmpty', 'No parameters for this template group.')}</Typography>
                ) : (
                  <Stack direction="row" gap={0.75} flexWrap="wrap">
                    {parameters.map(parameter => (
                      <Tooltip key={parameter.placeholder} title={parameter.placeholder} arrow>
                        <Chip
                          size="small"
                          variant="outlined"
                          color="primary"
                          icon={<AddIcon fontSize="small" />}
                          label={parameter.description || parameter.placeholder}
                          disabled={saving}
                          // Keep the focus (and the caret) in the field being edited.
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => insertPlaceholder(parameter.placeholder)}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {t('notificationTemplateParametersHint', 'Click a parameter to insert it at the cursor of the selected Subject or Body.')}
                </Typography>
              </Box>

              <Box onFocusCapture={() => setInsertTarget('body')}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {t('notificationTemplateBody', 'Body')} *
                  </Typography>
                  <ToggleButtonGroup size="small" exclusive value={bodyMode} disabled={saving} onChange={(_, next: BodyMode | null) => changeBodyMode(next)}>
                    <ToggleButton value="rich" sx={{ textTransform: 'none' }}>{t('notificationTemplateEditorRich', 'Visual editor')}</ToggleButton>
                    <ToggleButton value="html" sx={{ textTransform: 'none' }}>{t('notificationTemplateEditorHtml', 'HTML source')}</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                {richLostPlaceholders.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 1 }} onClose={() => setRichLostPlaceholders([])}>
                    {t('notificationTemplateRichEditorBlocked', 'The visual editor would remove these placeholders because of their position in the HTML. Keep editing in HTML source:')}{' '}
                    <Box component="span" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{richLostPlaceholders.join(', ')}</Box>
                  </Alert>
                )}
                {bodyMode === 'rich' ? (
                  <AnnouncementRichTextEditor
                    key="rich"
                    value={form.body_html}
                    disabled={saving}
                    error={errors.body_html}
                    editorHeight={320}
                    lockEditorHeight
                    onReady={handleRichReady}
                    onChange={value => update('body_html', value)}
                  />
                ) : (
                  <TextField
                    key="html"
                    fullWidth
                    multiline
                    minRows={14}
                    maxRows={24}
                    value={form.body_html}
                    inputRef={htmlRef}
                    error={Boolean(errors.body_html)}
                    helperText={errors.body_html}
                    disabled={saving}
                    onChange={event => update('body_html', event.target.value)}
                    slotProps={{ htmlInput: { spellCheck: false, style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13 } } }}
                  />
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  {t('notificationTemplateBodyHelper', 'HTML content shown in the Email and the in-app notification detail.')}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6.6 }} sx={{ minWidth: 0 }}>
            {/* Sticky inside the scrolling content only: the dialog footer (DialogActions) stays outside it. */}
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 0 } }}>
              <ProjectNotificationTemplatePreview
                dictionary={dictionary}
                locale={locale}
                subject={form.subject}
                bodyHtml={form.body_html}
                parameters={parameters}
                projectName={projectName}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {saveError && (
        <Box sx={{ px: 3, pt: 1.5 }}>
          <Alert severity="error">{saveError}</Alert>
        </Box>
      )}

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel} disabled={saving}>{projectCommonText(dictionary, 'cancel', 'Cancel')}</Button>
        <Button
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={submit}
        >
          {saving ? projectCommonText(dictionary, 'processing', 'Processing...') : t('notificationTemplateSave', 'Save project configuration')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProjectNotificationTemplateEditorDialog
