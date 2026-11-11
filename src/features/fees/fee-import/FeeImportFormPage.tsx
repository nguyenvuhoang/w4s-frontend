'use client'

import { Button, Paper, Stack, TextField } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import SwalAlert from '@/shared/utils/SwalAlert'

import { feeText } from '../components/feeTypeHelpers'
import { feeImportWorkflowService } from './feeImportWorkflow.service'
import type { FeeImportItem } from './feeImportWorkflow.types'

export default function FeeImportFormPage({ dictionary, locale, sessiontoken, item }: { dictionary: any; locale: string; sessiontoken?: string; item?: FeeImportItem | null }) {
  const router = useRouter(); const project = useWorkingProject(); const t = (key: string, fallback: string) => feeText(dictionary, key, fallback); const [saving, setSaving] = useState(false); const [importCode, setImportCode] = useState(item?.import_code ?? ''); const [fileName, setFileName] = useState(item?.file_name ?? ''); const [notes, setNotes] = useState(item?.notes ?? ''); const [status, setStatus] = useState(item?.status ?? 'A')
  const save = async () => { if (!fileName.trim() || (!item && !importCode.trim()) || saving || !project?.id || !project.code) return; setSaving(true); try { const result = item?.id ? await feeImportWorkflowService.update(sessiontoken, locale, project.code, { id: item.id, file_name: fileName.trim(), notes: notes.trim(), status }) : await feeImportWorkflowService.create(sessiontoken, locale, project.code, { project_id: project.id, import_code: importCode.trim(), file_name: fileName.trim(), notes: notes.trim() }); const id = result.id ?? item?.id; SwalAlert('success', t('fee_import_save_success', 'Fee import batch saved.'), 'top', false); if (id) router.push(`/${locale}/fee-import/${id}`) } catch (cause) { SwalAlert('error', cause, 'top', false) } finally { setSaving(false) } }
  return <ContentWrapper title={item ? t('fee_import_edit', 'Edit import batch') : t('fee_import_create', 'Create import batch')} description={t('fee_import_form_description', 'Manage the import batch metadata only.')} icon={<UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary}><Paper sx={{ p: 3, mt: 3 }}><Stack spacing={2}>{!item && <TextField required label={t('fee_import_code', 'Import code')} value={importCode} onChange={event => setImportCode(event.target.value)} />}{item && <TextField disabled label={t('fee_import_code', 'Import code')} value={importCode} />}<TextField required label={t('fee_import_file_name', 'File name')} value={fileName} onChange={event => setFileName(event.target.value)} /><TextField multiline minRows={3} label={t('fee_import_notes', 'Notes')} value={notes} onChange={event => setNotes(event.target.value)} />{item && <TextField label={t('fee_import_status', 'Status')} value={status} onChange={event => setStatus(event.target.value)} />}<Stack direction='row' spacing={1}><Button variant='contained' disabled={saving} onClick={() => void save()}>{t('save', 'Save')}</Button><Button onClick={() => router.back()}>{t('cancel', 'Cancel')}</Button></Stack></Stack></Paper></ContentWrapper>
}
