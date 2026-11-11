'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import FormatAlignLeftRounded from '@mui/icons-material/FormatAlignLeftRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'

import JsonEditorComponent from '@/@core/components/jSONEditor'
import type { Locale } from '@/configs/i18n'

import type { ConfigFilesDictionary } from '../types'
import { useStaticConfigFileDetail } from '../hooks/useStaticConfigFileDetail'
import { configFileText } from './configFileHelpers'

type StaticConfigFileDetailContentProps = {
  dictionary: ConfigFilesDictionary
  locale: Locale
  serviceCode: string
  serviceDisplayCode: string
  serviceName: string
  relativePath: string
}

const formatUtcDate = (value: string, locale: Locale) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC'
  }).format(date)
}

const StaticConfigFileDetailContent = ({ dictionary, locale, serviceCode, serviceDisplayCode, serviceName, relativePath }: StaticConfigFileDetailContentProps) => {
  const editor = useStaticConfigFileDetail(serviceCode, dictionary, relativePath)
  const listHref = `/${locale}/system-settings/config-files/${serviceCode}`
  const fileName = editor.relativePath.split('/').pop() || editor.relativePath || '-'

  return (
    <Stack spacing={4}>
      <Box>
        <Button href={listHref} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
          {serviceName}
        </Button>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              {configFileText(dictionary, 'config_files_detail_title', '{service} Configuration').replace('{service}', serviceName)}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1.5 }}>
              <Chip label={serviceDisplayCode} color='primary' size='small' />
              <Typography variant='body2' color='text.secondary'>
                {configFileText(dictionary, 'config_files_file_name_label', 'File name')}: {fileName}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
                {configFileText(dictionary, 'config_files_relative_path_label', 'Relative path')}: {editor.relativePath || relativePath || '-'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {configFileText(dictionary, 'config_files_last_modified_utc_label', 'Last modified UTC')}: {formatUtcDate(editor.lastModifiedUtc, locale)}
              </Typography>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant='outlined'
              startIcon={<RefreshRounded />}
              onClick={editor.loadConfig}
              disabled={editor.loading || editor.saving}
            >
              {configFileText(dictionary, 'config_files_refresh_button', 'Refresh')}
            </Button>
            <Button
              variant='outlined'
              startIcon={<FormatAlignLeftRounded />}
              onClick={editor.formatEditorJson}
              disabled={editor.loading || editor.saving || !editor.editorValue}
            >
              {configFileText(dictionary, 'config_files_format_button', 'Format JSON')}
            </Button>
            <Button
              variant='contained'
              startIcon={<SaveRounded />}
              onClick={editor.saveConfig}
              disabled={!editor.canSave}
            >
              {editor.saving ? configFileText(dictionary, 'config_files_saving_button', 'Saving...') : configFileText(dictionary, 'config_files_save_button', 'Save changes')}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {editor.hasUnsavedChanges && (
        <Alert severity='warning'>
          {configFileText(dictionary, 'config_files_unsaved_warning', 'You have unsaved changes. Save before leaving this page.')}
        </Alert>
      )}

      {editor.isEmptyContent && !editor.loading && !editor.notice && (
        <Alert severity='info'>
          {configFileText(dictionary, 'config_files_empty_content_notice', 'This file is empty. A default JSON object is shown so you can add configuration.')}
        </Alert>
      )}

      {!editor.validation.valid && !editor.loading && editor.validation.error && (
        <Alert severity='error'>
          {editor.validation.error}
        </Alert>
      )}

      {editor.notice && (
        <Alert severity={editor.notice.severity} onClose={() => editor.setNotice(null)}>
          {editor.notice.message}
        </Alert>
      )}

      <Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 2, overflow: 'hidden' }}>
        {editor.loading ? (
          <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ minHeight: 520 }}>
            <CircularProgress />
            <Typography color='text.secondary'>
              {configFileText(dictionary, 'config_files_loading', 'Loading configuration...')}
            </Typography>
          </Stack>
        ) : (
          <JsonEditorComponent
            initialText={editor.editorValue}
            onChange={updatedJson => editor.setEditorValue(JSON.stringify(updatedJson ?? {}, null, 2))}
            onChangeText={editor.setEditorValue}
            height='calc(100vh - 360px)'
            readOnly={editor.loading || editor.saving}
            mode='tree'
            modes={['tree', 'form', 'view', 'code', 'text', 'preview']}
          />
        )}
      </Paper>
    </Stack>
  )
}

export default StaticConfigFileDetailContent
