'use client'

import { useState } from 'react'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@shared/utils/SwalAlert'

import ProjectDeleteDialog from '../ProjectDeleteDialog'
import { projectCommonText, projectText, type ProjectDictionary } from '../projectListHelpers'
import ProjectNotificationTemplateEditorDialog from './ProjectNotificationTemplateEditorDialog'
import { isActiveTemplateStatus } from './projectNotificationTemplateHelpers'
import { templateChannelLabel, templateStatusLabel } from './projectNotificationTemplateLabels'
import type { ProjectNotificationTemplate, ProjectNotificationTemplateForm } from './projectNotificationTemplateTypes'
import { useProjectNotificationTemplates } from './useProjectNotificationTemplates'

type Props = {
  dictionary: ProjectDictionary
  locale: Locale
  /** Project of the detail route (never the working project context). */
  project: { id: number; name: string; code: string }
}

/**
 * "Mẫu thông báo" of System Settings > Project detail: the FEE templates of the project (global templates merged
 * with the project overrides), edited in a dialog and restorable to the system default when customized.
 * Mounted on the first opening of the tab and kept mounted, so switching tabs does not reload it.
 */
const ProjectNotificationTemplatesTab = ({ dictionary, locale, project }: Props) => {
  const t = (key: string, fallback: string) => projectText(dictionary, key, fallback)
  const { data: session } = useSession()

  const state = useProjectNotificationTemplates({
    projectId: project.id,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    messages: {
      loadError: t('notificationTemplatesLoadError', 'Unable to load notification templates.'),
      parametersError: t('notificationTemplateParametersError', 'Unable to load template parameters.'),
      saveError: t('notificationTemplateSaveError', 'Unable to save the notification template.'),
      resetError: t('notificationTemplateResetError', 'Unable to restore the default template.')
    }
  })

  const [editing, setEditing] = useState<ProjectNotificationTemplate | null>(null)
  const [resetTarget, setResetTarget] = useState<ProjectNotificationTemplate | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const openEditor = (template: ProjectNotificationTemplate) => {
    state.clearSubmitErrors()
    setEditing(template)
  }

  const closeEditor = () => {
    if (state.saving) return
    state.clearSubmitErrors()
    setEditing(null)
  }

  const save = async (form: ProjectNotificationTemplateForm) => {
    if (!editing) return

    const ok = await state.saveTemplate(editing, form)

    if (!ok) return

    setEditing(null)
    setNotice(null)
    SwalAlert('success', t('notificationTemplateSaveSuccess', 'The notification template was saved for this project.'), 'center', false, false, true)
  }

  const openReset = (template: ProjectNotificationTemplate) => {
    if (!template.is_customized) return
    state.clearSubmitErrors()
    setResetTarget(template)
  }

  const cancelReset = () => {
    if (state.resetting) return
    state.clearSubmitErrors()
    setResetTarget(null)
  }

  const confirmReset = async () => {
    if (!resetTarget) return

    const result = await state.resetTemplate(resetTarget)

    if (!result.ok) return

    setResetTarget(null)

    if (result.stillCustomized) {
      setNotice(t('notificationTemplateResetStillCustomized', 'The restore request was sent, but the template is still customized for this project.'))

      return
    }

    setNotice(null)
    SwalAlert('success', t('notificationTemplateResetSuccess', 'The system default template was restored.'), 'center', false, false, true)
  }

  const retry = () => void state.reload()

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('notificationTemplatesTitle', 'Notification templates')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('notificationTemplatesSubtitle', 'Configure the fee notification templates of this project. Templates that are not customized use the system template.')}
            </Typography>
          </Stack>
          <Stack spacing={0.25} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{project.name}</Typography>
            <Chip size="small" label={project.code} sx={{ fontWeight: 700 }} />
          </Stack>
        </Stack>

        {notice && <Alert severity="warning" onClose={() => setNotice(null)}>{notice}</Alert>}

        {state.loading && !state.loaded ? (
          <Stack spacing={1.5}>
            {[0, 1, 2].map(index => <Skeleton key={index} variant="rounded" height={112} />)}
          </Stack>
        ) : state.error ? (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" disabled={state.loading} onClick={retry}>{projectCommonText(dictionary, 'retry', 'Retry')}</Button>}
          >
            {state.error}
          </Alert>
        ) : state.loaded && state.templates.length === 0 ? (
          <Alert severity="info">{t('notificationTemplatesEmpty', 'No notification templates are available for this group.')}</Alert>
        ) : (
          <Stack spacing={1.5} sx={{ opacity: state.loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {state.templates.map(template => (
              <Paper key={template.template_code} variant="outlined" sx={{ p: { xs: 1.75, md: 2.25 }, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                  <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{template.template_name || template.template_code}</Typography>
                      <Chip size="small" variant="outlined" label={template.template_code} sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      {template.is_customized ? (
                        <Chip size="small" color="success" label={t('notificationTemplateCustomized', 'Customized for this project')} />
                      ) : (
                        <Chip size="small" label={t('notificationTemplateGlobal', 'System template')} />
                      )}
                      {template.is_default && (
                        <Chip size="small" color="primary" variant="outlined" label={t('notificationTemplateIsDefault', 'Default template')} />
                      )}
                      <Chip size="small" variant="outlined" label={`${t('notificationTemplateChannel', 'Channel')}: ${templateChannelLabel(dictionary, template.channel)}`} />
                      <Chip
                        size="small"
                        variant="outlined"
                        color={isActiveTemplateStatus(template.status) ? 'success' : 'default'}
                        label={`${t('notificationTemplateStatus', 'Status')}: ${templateStatusLabel(dictionary, template.status)}`}
                      />
                    </Stack>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">{t('notificationTemplateSubjectLabel', 'Subject')}</Typography>
                      <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflowWrap: 'anywhere' }}>
                        {template.subject || '-'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'row', md: 'column' }} gap={1} alignItems={{ xs: 'stretch', md: 'flex-end' }} sx={{ flexShrink: 0 }}>
                    <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} disabled={state.loading} onClick={() => openEditor(template)}>
                      {t('notificationTemplateEdit', 'Edit')}
                    </Button>
                    {template.is_customized && (
                      <Button variant="text" color="warning" size="small" startIcon={<RestartAltOutlinedIcon />} disabled={state.loading} onClick={() => openReset(template)}>
                        {t('notificationTemplateReset', 'Restore default')}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {editing && (
        <ProjectNotificationTemplateEditorDialog
          key={`${editing.template_code}-${editing.id ?? 'global'}`}
          dictionary={dictionary}
          locale={locale}
          template={editing}
          projectName={project.name}
          parameters={state.parameters}
          parametersLoading={state.parametersLoading}
          parametersError={state.parametersError}
          onRetryParameters={() => void state.reloadParameters()}
          saving={state.saving}
          saveError={state.saveError}
          onCancel={closeEditor}
          onSave={form => void save(form)}
        />
      )}

      <ProjectDeleteDialog
        open={Boolean(resetTarget)}
        deleting={state.resetting}
        error={state.resetError}
        labels={{
          title: t('notificationTemplateResetTitle', 'Restore the default template'),
          message: t('notificationTemplateResetMessage', 'All project-specific changes of this template will be discarded and the project will use the system template again. Do you want to continue?'),
          cancel: projectCommonText(dictionary, 'cancel', 'Cancel'),
          confirm: t('notificationTemplateReset', 'Restore default'),
          processing: projectCommonText(dictionary, 'processing', 'Processing...')
        }}
        onCancel={cancelReset}
        onConfirm={() => void confirmReset()}
      />
    </Paper>
  )
}

export default ProjectNotificationTemplatesTab
