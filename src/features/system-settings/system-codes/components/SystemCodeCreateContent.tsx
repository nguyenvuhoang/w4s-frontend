'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import SaveRounded from '@mui/icons-material/SaveRounded'
import { Alert, Button, CircularProgress, FormControlLabel, Grid, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'

import { systemCodeService } from '../services/systemCodeService'
import type { SystemCodeCreateRequest, SystemCodesDictionary } from '../types'
import { commonText, systemCodeText } from './systemCodeHelpers'

type CreateForm = {
  code_id: string; code_name: string; code_group: string; caption_vi: string; caption_en: string
  code_index: string; code_value: string; ftag: string; visible: boolean; app: string
}

const emptyForm = (codeName: string, codeGroup: string, app: string): CreateForm => ({
  code_id: '', code_name: codeName, code_group: codeGroup, caption_vi: '', caption_en: '', code_index: '', code_value: '', ftag: '', visible: true, app: app || 'IPS'
})

const SystemCodeCreateContent = ({ dictionary, locale }: { dictionary: SystemCodesDictionary; locale: Locale }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeName = searchParams.get('code_name')?.trim() ?? ''
  const codeGroup = searchParams.get('code_group')?.trim() ?? ''
  const app = searchParams.get('app')?.trim() ?? 'IPS'
  const [form, setForm] = useState(() => emptyForm(codeName, codeGroup, app))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isCreateUnderCodeName = Boolean(codeName)

  const update = <K extends keyof CreateForm>(key: K, value: CreateForm[K]) => setForm(current => ({ ...current, [key]: value }))
  const backToList = () => router.push(`/${locale}/system-settings/general${codeName ? `?search_text=${encodeURIComponent(codeName)}` : ''}`)

  const save = async () => {
    if (saving) return
    const required = [form.code_id, form.code_name, form.code_group, form.caption_vi, form.code_value, form.app].every(value => value.trim())
    if (!required || form.code_index.trim() === '' || !Number.isFinite(Number(form.code_index))) {
      setError(systemCodeText(dictionary, 'create_validation_failed', 'Please complete all required fields and enter a valid order.'))
      return
    }

    const payload: SystemCodeCreateRequest = {
      code_id: form.code_id.trim(), code_name: form.code_name.trim(), code_group: form.code_group.trim(), caption: form.caption_vi.trim(),
      m_caption: JSON.stringify({ en: form.caption_en.trim(), vi: form.caption_vi.trim() }), code_index: Number(form.code_index),
      code_value: form.code_value.trim(), ftag: form.ftag.trim(), visible: Boolean(form.visible), app: form.app.trim(), page_index: 0, page_size: 10
    }
    setSaving(true); setError(null)
    try {
      await systemCodeService.createSystemCode({ language: locale, fields: payload })
      SwalAlert('success', systemCodeText(dictionary, 'create_success', 'System code created successfully.'), 'center')
      router.push(`/${locale}/system-settings/general?search_text=${encodeURIComponent(payload.code_name)}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : systemCodeText(dictionary, 'create_failed', 'Unable to create system code.'))
    } finally { setSaving(false) }
  }

  return <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {isCreateUnderCodeName ? systemCodeText(dictionary, 'create_value_title', `Add value to ${codeName}`).replace('{code_name}', codeName) : systemCodeText(dictionary, 'create_category_title', 'Create New Category')}
          </Typography>
          {isCreateUnderCodeName && <Typography color="text.secondary">{systemCodeText(dictionary, 'create_group_hint', 'Code list group')}: <strong>{codeName}</strong></Typography>}
        </Stack>
        <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={backToList} disabled={saving}>{systemCodeText(dictionary, 'back_to_list', 'Back to list')}</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_code_id', 'Code')} value={form.code_id} onChange={e => update('code_id', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required disabled={isCreateUnderCodeName} label={systemCodeText(dictionary, 'field_code_name', 'Code Name')} value={form.code_name} onChange={e => update('code_name', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_code_group', 'System Group')} value={form.code_group} onChange={e => update('code_group', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_app', 'Application')} value={form.app} onChange={e => update('app', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_m_caption_vi', 'Vietnamese Name')} value={form.caption_vi} onChange={e => update('caption_vi', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_m_caption_en', 'English Name')} value={form.caption_en} onChange={e => update('caption_en', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_code_index', 'Order')} inputMode="numeric" value={form.code_index} onChange={e => update('code_index', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={systemCodeText(dictionary, 'field_code_value', 'Value')} value={form.code_value} onChange={e => update('code_value', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={systemCodeText(dictionary, 'field_ftag', 'Tag')} value={form.ftag} onChange={e => update('ftag', e.target.value)} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><FormControlLabel control={<Switch checked={form.visible} onChange={e => update('visible', e.target.checked)} />} label={systemCodeText(dictionary, 'field_visible', 'Visible')} /></Grid>
      </Grid>
      <Stack direction="row" justifyContent="flex-end" gap={1}><Button color="inherit" onClick={backToList} disabled={saving}>{commonText(dictionary, 'cancel', 'Cancel')}</Button><Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} onClick={() => void save()} disabled={saving}>{saving ? systemCodeText(dictionary, 'saving', 'Saving...') : systemCodeText(dictionary, 'create_button', 'Create')}</Button></Stack>
    </Stack>
  </Paper>
}

export default SystemCodeCreateContent
