'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField
} from '@mui/material'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'

import { useSystemCodeUpdate, toSystemCodeEditForm, type SystemCodeEditForm } from '../hooks/useSystemCodeUpdate'
import { useSystemCodeDelete } from '../hooks/useSystemCodeDelete'
import type { SystemCodeItem, SystemCodesDictionary } from '../types'
import { commonText, systemCodeText } from './systemCodeHelpers'

type Props = {
  dictionary: SystemCodesDictionary
  locale: Locale
  item: SystemCodeItem | null
  onClose: () => void
  onUpdated: () => Promise<void>
  onDeleted: () => Promise<void>
}

const SystemCodeEditDialog = ({ dictionary, locale, item, onClose, onUpdated, onDeleted }: Props) => {
  const [form, setForm] = useState<SystemCodeEditForm | null>(item ? toSystemCodeEditForm(item) : null)
  const update = useSystemCodeUpdate({ dictionary, language: locale, item })
  const deletion = useSystemCodeDelete({ dictionary, language: locale, item, onDeleted })

  const setField = <K extends keyof SystemCodeEditForm>(key: K, value: SystemCodeEditForm[K]) => {
    setForm(current => current ? { ...current, [key]: value } : current)
    update.setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const setCaptionField = (language: string, value: string) => {
    setForm(current => current ? { ...current, m_caption: { ...current.m_caption, [language]: value } } : current)
  }

  const save = async () => {
    if (!form) return

    try {
      if (!await update.save(form)) return

      SwalAlert('success', systemCodeText(dictionary, 'update_success', 'System code updated successfully.'), 'center')
      await onUpdated()
    } catch (error) {
      SwalAlert('error', error instanceof Error ? error.message : systemCodeText(dictionary, 'update_failed', 'Unable to update system code.'), 'center')
    }
  }

  return (
    <Dialog open={Boolean(item && form)} onClose={update.saving || deletion.deleting ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{systemCodeText(dictionary, 'detail_title', 'Update System Code')}</DialogTitle>
      <DialogContent dividers>
        {!form ? null : (
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {form.id <= 0 && <Alert severity="error">{systemCodeText(dictionary, 'invalid_record', 'This record has no valid ID and cannot be updated.')}</Alert>}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth disabled label="ID" value={form.id || ''} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_app', 'Application')} value={form.app} onChange={event => setField('app', event.target.value)} error={Boolean(update.fieldErrors.app)} helperText={update.fieldErrors.app} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_code_id', 'Code')} value={form.code_id} onChange={event => setField('code_id', event.target.value)} error={Boolean(update.fieldErrors.code_id)} helperText={update.fieldErrors.code_id} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_code_name', 'Code Name')} value={form.code_name} onChange={event => setField('code_name', event.target.value)} error={Boolean(update.fieldErrors.code_name)} helperText={update.fieldErrors.code_name} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_code_group', 'System Group')} value={form.code_group} onChange={event => setField('code_group', event.target.value)} error={Boolean(update.fieldErrors.code_group)} helperText={update.fieldErrors.code_group} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_code_index', 'Order')} value={form.code_index} onChange={event => setField('code_index', event.target.value)} error={Boolean(update.fieldErrors.code_index)} helperText={update.fieldErrors.code_index} inputMode="numeric" /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_caption', 'Default Name')} value={form.caption} onChange={event => setField('caption', event.target.value)} error={Boolean(update.fieldErrors.caption)} helperText={update.fieldErrors.caption} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_m_caption_vi', 'Vietnamese Name')} value={form.m_caption.vi ?? ''} onChange={event => setCaptionField('vi', event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_m_caption_en', 'English Name')} value={form.m_caption.en ?? ''} onChange={event => setCaptionField('en', event.target.value)} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_code_value', 'Value')} value={form.code_value} onChange={event => setField('code_value', event.target.value)} error={Boolean(update.fieldErrors.code_value)} helperText={update.fieldErrors.code_value} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_ftag', 'Tag')} value={form.ftag} onChange={event => setField('ftag', event.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><FormControlLabel control={<Switch checked={form.visible} onChange={event => setField('visible', event.target.checked)} />} label={systemCodeText(dictionary, 'field_visible', 'Visible')} /></Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="error" startIcon={deletion.deleting ? <CircularProgress size={16} color="error" /> : <DeleteOutlineRounded />} onClick={() => void deletion.confirmDelete()} disabled={update.saving || deletion.deleting || !form || form.id <= 0}>
          {deletion.deleting ? systemCodeText(dictionary, 'deleting', 'Đang xóa...') : systemCodeText(dictionary, 'delete_button', 'Xóa')}
        </Button>
        <Button color="inherit" startIcon={<CloseRounded />} onClick={onClose} disabled={update.saving || deletion.deleting}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
        <Button variant="contained" startIcon={update.saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} onClick={() => void save()} disabled={update.saving || deletion.deleting || !form || form.id <= 0}>
          {update.saving ? systemCodeText(dictionary, 'saving', 'Saving...') : systemCodeText(dictionary, 'save_changes', 'Save changes')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SystemCodeEditDialog
