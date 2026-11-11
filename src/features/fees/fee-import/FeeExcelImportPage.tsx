'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import PublishIcon from '@mui/icons-material/Publish'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { getFeePeriodStatusCaption, useFeePeriodStatusCodeList } from '@/features/system-settings/fee-management/hooks/useFeePeriodStatusCodeList'
import SwalAlert, { escapeHtml } from '@/shared/utils/SwalAlert'

import { feeText } from '../components/feeTypeHelpers'
import type { FeePeriodItem } from '../types'
import { mapFeeExcelImport, mapFeeExcelValidation } from './feeImport.mapper'
import { FEE_EXCEL_PREVIEW_COLUMNS, formatFeeExcelPreviewValue, getFeeExcelPreviewValue } from './feeImportPreview'
import { FeeExcelImportError, feeImportService } from './feeImport.service'
import type { FeeExcelDuplicatePolicy, FeeExcelImportResult, FeeExcelPreviewRow, FeeExcelValidationResult, FeeImportPageProps } from './feeImport.types'
import { useFeeImportPickers } from './hooks/useFeeImportPickers'

const isXlsx = (file: File) => file.name.toLowerCase().endsWith('.xlsx')
const count = (value: number | null) => value === null ? '-' : new Intl.NumberFormat().format(value)
const previewHeaderSx = { bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }

export default function FeeExcelImportPage({ dictionary, locale, sessiontoken }: FeeImportPageProps) {
  const router = useRouter()
  const workingProject = useWorkingProject()
  const t = useCallback((key: string, fallback: string) => feeText(dictionary, key, fallback), [dictionary])
  const [projectId, setProjectId] = useState<number | null>(workingProject?.id ?? null)
  const [feePeriodId, setFeePeriodId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<FeeExcelValidationResult | null>(null)
  const [result, setResult] = useState<FeeExcelImportResult | null>(null)
  const [policy, setPolicy] = useState<FeeExcelDuplicatePolicy>('SKIP')
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL')
  const [loading, setLoading] = useState<'template' | 'validate' | 'import' | null>(null)
  const [error, setError] = useState<{ message: string; executionId?: string | null } | null>(null)
  const importInFlight = useRef(false)
  const pickers = useFeeImportPickers({ sessiontoken, language: locale, projectId })
  const statusCodes = useFeePeriodStatusCodeList(locale)

  const resetValidatedState = useCallback(() => {
    setValidation(null)
    setResult(null)
    setError(null)
  }, [])
  const previousWorkingProjectIdRef = useRef<number | null>(workingProject?.id ?? null)
  useEffect(() => {
    if (!workingProject?.id) return
    if (previousWorkingProjectIdRef.current === workingProject.id) return
    previousWorkingProjectIdRef.current = workingProject.id
    setProjectId(workingProject.id)
    setFeePeriodId(null)
    resetValidatedState()
  }, [resetValidatedState, workingProject?.id])
  const setSelectedFile = (next: File | null) => {
    setFile(next)
    resetValidatedState()
  }
  const onDrop = useCallback((accepted: File[]) => {
    const next = accepted[0]
    if (!next) return
    if (!isXlsx(next)) {
      SwalAlert('warning', t('fee_excel_import_invalid_file', 'Only .xlsx files are accepted.'), 'top', false)
      return
    }
    setSelectedFile(next)
  }, [t])
  const dropzone = useDropzone({ accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }, multiple: false, onDrop })

  const selectedPeriod = useMemo(() => pickers.periods.find(period => period.id === feePeriodId) ?? null, [feePeriodId, pickers.periods])
  const selectablePeriods = useMemo(() => {
    const validStatuses = new Set(statusCodes.options.map(option => option.value.toUpperCase()))
    return pickers.periods.filter(period => validStatuses.has(period.status.toUpperCase()))
  }, [pickers.periods, statusCodes.options])
  const hasMatchingProjectContext = Boolean(workingProject && projectId === workingProject.id && workingProject.code)
  const filteredPreviewRows = useMemo(() => validation?.rows.filter(row => previewFilter === 'ALL' || (previewFilter === 'VALID' ? row.valid === true : row.valid === false)) ?? [], [previewFilter, validation?.rows])

  const showError = (cause: unknown, fallback: string) => {
    const mapped = cause instanceof FeeExcelImportError ? { message: cause.message, executionId: cause.executionId } : { message: cause instanceof Error ? cause.message : fallback }
    setError(mapped)
    SwalAlert('error', { message: mapped.message, execution_id: mapped.executionId }, 'top', false)
  }
  const downloadTemplate = async () => {
    setLoading('template')
    try {
      const template = await feeImportService.downloadTemplate({ language: locale, projectCode: workingProject?.code, failedMessage: t('fee_excel_import_template_failed', 'Unable to download the Excel template.') })
      const url = URL.createObjectURL(template.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = template.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (cause) { showError(cause, t('fee_excel_import_template_failed', 'Unable to download the Excel template.')) } finally { setLoading(null) }
  }
  const validate = async () => {
    if (!hasMatchingProjectContext) {
      SwalAlert('warning', t('fee_excel_import_project_context_mismatch', 'The selected project does not match the active project context.'), 'top', false)
      return
    }
    if (!projectId || !file) {
      SwalAlert('warning', t('fee_excel_import_required_validate', 'Select a project and an Excel file first.'), 'top', false)
      return
    }
    setLoading('validate')
    setError(null)
    try {
      const payload = await feeImportService.validate(file, projectId, workingProject!.code, locale, t('fee_excel_import_validate_failed', 'Unable to validate the Excel file.'))
      setValidation(mapFeeExcelValidation(payload))
    } catch (cause) { showError(cause, t('fee_excel_import_validate_failed', 'Unable to validate the Excel file.')) } finally { setLoading(null) }
  }
  const executeImport = async () => {
    if (!projectId || !feePeriodId || !file || !validation || !hasMatchingProjectContext || validation.hasBlockingErrors || importInFlight.current) return
    importInFlight.current = true
    setLoading('import')
    setError(null)
    try {
      const payload = await feeImportService.import(file, projectId, workingProject!.code, feePeriodId, policy, notes, locale, t('fee_excel_import_submit_failed', 'Unable to import the Excel file.'))
      const mapped = mapFeeExcelImport(payload)
      setResult(mapped)
      if (!mapped.feeImportId) {
        setError({ message: t('fee_excel_import_missing_id', 'Import was accepted but no fee import ID was returned. Please contact support with the error reference.') })
        return
      }

      SwalAlert('success', t('fee_excel_import_success', 'Fee import created and is ready for review.'), 'top', false)
      router.push(`/${locale}/fee-import/${mapped.feeImportId}`)
    } catch (cause) { showError(cause, t('fee_excel_import_submit_failed', 'Unable to import the Excel file.')) } finally { importInFlight.current = false; setLoading(null) }
  }
  const confirmImport = () => {
    const warning = policy === 'UPDATE' ? `<br/><strong>${escapeHtml(t('fee_excel_import_update_warning', 'Existing duplicate records will be updated.'))}</strong>` : ''
    SwalAlert('question', '', 'top', false, true, true, () => void executeImport(), t('fee_excel_import_confirm', 'Continue'), {
      title: t('fee_excel_import_confirm_title', 'Confirm fee import'),
      cancelButtonText: t('cancel', 'Cancel'),
      html: `${escapeHtml(t('fee_excel_import_confirm_message', 'Import the validated Excel file into the selected fee period?'))}${warning}`
    })
  }
  const errorRef = error?.executionId ? `${locale === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'}: ${error.executionId}` : null
  const goBack = () => {
    const feeImportHref = window.sessionStorage.getItem('ips:fee-import:return-href')
    if (feeImportHref) {
      window.sessionStorage.removeItem('ips:fee-import:return-href')
      router.push(feeImportHref)
      return
    }
    router.push(`/${locale}/fee-management`)
  }

  return <ContentWrapper
    title={t('fee_excel_import_title', 'Import fees from Excel')}
    description={t('fee_excel_import_description', 'Validate and import accounting fee data from an Excel file.')}
    dictionary={dictionary}
    icon={<UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
    issearch
  >
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction='row' justifyContent='flex-end'><Button startIcon={<ArrowBackIcon />} onClick={goBack}>{t('fee_excel_import_back', 'Back to fee list')}</Button></Stack>
      {error && <Alert severity='error'>{error.message}{errorRef ? <><br />{errorRef}</> : null}</Alert>}
      {pickers.error && <Alert severity='warning'>{pickers.error.message}</Alert>}
      {statusCodes.error && <Alert severity='warning'>{t('fee_excel_import_status_load_failed', 'Unable to load fee period statuses.')}</Alert>}
      <Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}>
        <Typography variant='h6'>{t('fee_excel_import_information', 'Import information')}</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth disabled label={t('fee_excel_import_project', 'Project')} value={workingProject ? `${workingProject.code} - ${workingProject.name}` : ''} helperText={workingProject ? undefined : t('fee_import_select_project', 'Select a project from the global header to continue.')} />
          <FormControl fullWidth required disabled={!projectId || pickers.periodsLoading || statusCodes.isLoading}><InputLabel>{t('fee_excel_import_period', 'Fee period')}</InputLabel><Select value={feePeriodId?.toString() ?? ''} label={t('fee_excel_import_period', 'Fee period')} onChange={event => { setFeePeriodId(event.target.value ? Number(event.target.value) : null); resetValidatedState() }}>
            {selectablePeriods.map(period => <MenuItem key={period.id} value={period.id!}>{periodLabel(period, statusCodes.captionMap)}</MenuItem>)}
          </Select></FormControl>
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label={t('fee_excel_import_notes', 'Description')}
          placeholder={t('fee_excel_import_notes_placeholder', 'Enter a description or notes for this import batch...')}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          disabled={loading === 'import'}
        />
        <Box><Button size='small' variant='outlined' startIcon={loading === 'template' ? <CircularProgress size={16} /> : <DownloadIcon />} disabled={loading === 'template'} onClick={() => void downloadTemplate()}>{t('fee_excel_import_download_template', 'Download Excel template')}</Button></Box>
      </Stack></Paper>
      <Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}>
        <Typography variant='h6'>{t('fee_excel_import_upload', 'Upload Excel')}</Typography>
        <Box {...dropzone.getRootProps()} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: { xs: 2, md: 2.5 }, textAlign: 'center', cursor: 'pointer' }}><input {...dropzone.getInputProps()} /><UploadFileIcon color='action' sx={{ fontSize: 32 }} /><Typography variant='body2'>{t('fee_excel_import_upload_hint', 'Drag an .xlsx file here or click to choose a file.')}</Typography></Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ sm: 'center' }} spacing={1}><Typography variant='body2'>{file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : t('fee_excel_import_no_file', 'No file selected')}</Typography><Button size='small' variant='contained' startIcon={loading === 'validate' ? <CircularProgress size={16} color='inherit' /> : <PublishIcon />} disabled={!projectId || !file || loading !== null} onClick={() => void validate()}>{t('fee_excel_import_validate', 'Validate data')}</Button></Stack>
      </Stack></Paper>
      {validation && <Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}>
        <Typography variant='h6'>{t('fee_excel_import_validation_result', 'Validation result')}</Typography>
        <Stack direction='row' gap={1} flexWrap='wrap'><Chip label={`${t('fee_excel_import_total_rows', 'Total rows')}: ${count(validation.totalRows)}`} /><Chip color='success' label={`${t('fee_excel_import_valid_rows', 'Valid rows')}: ${count(validation.validRows)}`} /><Chip color={validation.errorRows ? 'error' : 'default'} label={`${t('fee_excel_import_error_rows', 'Error rows')}: ${count(validation.errorRows)}`} />{validation.nttkRows !== null && <Chip color='info' label={`${t('fee_excel_import_nttk_rows', 'NTTK rows')}: ${count(validation.nttkRows)}`} />}</Stack>
        {validation.rows.length > 0 && <><ToggleButtonGroup exclusive size='small' value={previewFilter} onChange={(_, next: 'ALL' | 'VALID' | 'INVALID' | null) => next && setPreviewFilter(next)} aria-label={t('fee_excel_import_preview_filter', 'Preview filter')}><ToggleButton value='ALL'>{t('fee_excel_import_filter_all', 'All')}</ToggleButton><ToggleButton value='VALID'>{t('fee_excel_import_valid', 'Valid')}</ToggleButton><ToggleButton value='INVALID'>{t('fee_excel_import_invalid', 'Invalid')}</ToggleButton></ToggleButtonGroup><TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}><Table stickyHeader size='small' sx={{ minWidth: 2360 }}><TableHead><TableRow>{FEE_EXCEL_PREVIEW_COLUMNS.map(column => <TableCell key={column.key} align={column.amount ? 'right' : 'left'} sx={{ ...previewHeaderSx, minWidth: column.key === 'description' ? 240 : 150 }}>{t(column.labelKey, column.labelKey)}</TableCell>)}<TableCell sx={previewHeaderSx}>{t('fee_excel_import_status', 'Status')}</TableCell><TableCell sx={{ ...previewHeaderSx, minWidth: 320 }}>{t('fee_excel_import_errors', 'Errors')}</TableCell></TableRow></TableHead><TableBody>{filteredPreviewRows.map((row, index) => <PreviewRow key={`${row.rowNumber}-${index}`} row={row} validText={t('fee_excel_import_valid', 'Valid')} errorText={t('fee_excel_import_invalid', 'Invalid')} locale={locale} />)}</TableBody></Table></TableContainer></>}
      </Stack></Paper>}
      {validation && <Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}>
        <Typography variant='h6'>{t('fee_excel_import_confirmation', 'Import confirmation')}</Typography>
        <TextField select fullWidth label={t('fee_excel_import_duplicate_policy', 'Duplicate policy')} value={policy} onChange={event => setPolicy(event.target.value as FeeExcelDuplicatePolicy)}><MenuItem value='SKIP'>{t('fee_excel_import_skip', 'Skip duplicate records')}</MenuItem><MenuItem value='UPDATE'>{t('fee_excel_import_update', 'Update duplicate records')}</MenuItem></TextField>
        {policy === 'UPDATE' && <Alert severity='warning'>{t('fee_excel_import_update_warning', 'Existing duplicate records will be updated.')}</Alert>}
        {validation.hasBlockingErrors && <Alert severity='error'>{t('fee_excel_import_blocked', 'Resolve validation errors before importing.')}</Alert>}
        <Stack direction='row' justifyContent='flex-end' spacing={1}><Button size='small' variant='outlined' startIcon={<CancelOutlinedIcon />} disabled={loading !== null} onClick={goBack}>{t('cancel', 'Cancel')}</Button><Button size='small' variant='contained' startIcon={loading === 'import' ? <CircularProgress size={16} color='inherit' /> : <UploadFileIcon />} disabled={!selectedPeriod || !hasMatchingProjectContext || validation.hasBlockingErrors || loading !== null} onClick={confirmImport}>{t('fee_excel_import_submit', 'Import fees')}</Button></Stack>
      </Stack></Paper>}
      {result && <Paper variant='outlined' sx={{ p: 3 }}><Stack spacing={2}><Typography variant='h6'>{t('fee_excel_import_result', 'Import result')}</Typography><Stack direction='row' gap={1} flexWrap='wrap'><Chip color='success' label={`${t('fee_excel_import_created', 'Created')}: ${count(result.created)}`} /><Chip label={`${t('fee_excel_import_skipped', 'Skipped')}: ${count(result.skipped)}`} /><Chip color='info' label={`${t('fee_excel_import_updated', 'Updated')}: ${count(result.updated)}`} /><Chip color={result.errors ? 'error' : 'default'} label={`${t('fee_excel_import_errors', 'Errors')}: ${count(result.errors)}`} />{result.nttkRows !== null && <Chip color='info' label={`${t('fee_excel_import_nttk_rows', 'NTTK rows')}: ${count(result.nttkRows)}`} />}</Stack><Button variant='outlined' onClick={() => router.push(`/${locale}/fee-management`)}>{t('fee_excel_import_view_fees', 'View fee list')}</Button></Stack></Paper>}
    </Stack>
  </ContentWrapper>
}

function periodLabel(period: FeePeriodItem, captions: ReadonlyMap<string, string>) {
  return [period.period_code || period.period_name || `#${period.id}`, getFeePeriodStatusCaption(captions, period.status)].filter(Boolean).join(' — ')
}

function PreviewRow({ row, validText, errorText, locale }: { row: FeeExcelPreviewRow; validText: string; errorText: string; locale: string }) {
  const statusLabel = row.valid === false ? errorText : row.valid === true ? validText : row.validationStatus ?? '—'
  return <TableRow sx={{ '&:last-child td': { borderBottom: 0 }, ...(row.valid === false ? { bgcolor: 'error.50' } : {}) }}>{FEE_EXCEL_PREVIEW_COLUMNS.map(column => <TableCell key={column.key} align={column.amount ? 'right' : 'left'} sx={{ maxWidth: column.key === 'description' ? 320 : undefined, whiteSpace: column.key === 'description' ? 'normal' : 'nowrap' }}>{formatFeeExcelPreviewValue(getFeeExcelPreviewValue(row.values, column.key), Boolean(column.amount), locale)}</TableCell>)}<TableCell><Chip size='small' color={row.valid === false ? 'error' : row.valid === true ? 'success' : 'default'} label={statusLabel} /></TableCell><TableCell sx={{ whiteSpace: 'pre-wrap', minWidth: 320 }}>{row.errors.join('\n') || '—'}</TableCell></TableRow>
}
