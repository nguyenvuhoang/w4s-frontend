'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DownloadIcon from '@mui/icons-material/Download'
import GroupIcon from '@mui/icons-material/Group'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import type { Session } from 'next-auth'
import { useCallback, useMemo, useState } from 'react'
import type { FileError } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import SwalAlert from '@/shared/utils/SwalAlert'

import { downloadStaffImportTemplate, getValidatedStaffImportUsers, StaffImportSubmitError, submitStaffImport, validateStaffImportFile, type StaffImportValidationResult } from '../services/staffImportTemplateService'
import type { StaffDictionary } from '../types'
import { inspectStaffImportFile, type StaffImportSourceInspection } from '../utils/staffImportParser'
import StaffImportTour from './staff-import/StaffImportTour'
import { staffText } from './staff-list/staffListHelpers'

type Props = { dictionary: StaffDictionary; session: Session | null; locale: Locale }
type TextFn = (key: string, fallback: string) => string
type CountKeys = { create: [string, string]; update: [string, string]; mixed: [string, string]; generic: [string, string] }

/** Builds a Create/Update-count-aware message (button label, confirm text, success text) from
 *  the validation result's server-provided create_count/update_count — never recomputed ad hoc
 *  per call site. Falls back to a generic message when neither count is known (e.g. legacy
 *  `action` values the mapper couldn't classify). */
const describeCounts = (t: TextFn, createCount: number, updateCount: number, keys: CountKeys) => {
    if (createCount > 0 && updateCount > 0) return t(...keys.mixed).replace('{createCount}', String(createCount)).replace('{updateCount}', String(updateCount))
    if (createCount > 0) return t(...keys.create).replace('{count}', String(createCount))
    if (updateCount > 0) return t(...keys.update).replace('{count}', String(updateCount))

    return t(...keys.generic)
}

const SUBMIT_LABEL_KEYS: CountKeys = {
    create: ['bulk_import_submit_create', 'Thêm mới {count} nhân viên'],
    update: ['bulk_import_submit_update', 'Cập nhật {count} nhân viên'],
    mixed: ['bulk_import_submit_mixed', 'Thêm mới {createCount} / Cập nhật {updateCount} nhân viên'],
    generic: ['bulk_import_submit', 'Import nhân viên']
}
const CONFIRM_MESSAGE_KEYS: CountKeys = {
    create: ['bulk_import_confirm_create', 'File có {count} nhân viên thêm mới. Bạn có chắc chắn muốn tiếp tục?'],
    update: ['bulk_import_confirm_update', 'File có {count} nhân viên cập nhật. Bạn có chắc chắn muốn tiếp tục?'],
    mixed: ['bulk_import_confirm_mixed', 'File có {createCount} nhân viên thêm mới và {updateCount} nhân viên cập nhật. Bạn có chắc chắn muốn tiếp tục?'],
    generic: ['bulk_import_confirm', 'Bạn có chắc muốn tiếp tục import các dòng hợp lệ?']
}
const SUCCESS_MESSAGE_KEYS: CountKeys = {
    create: ['bulk_import_success_create', 'Đã thêm mới {count} nhân viên thành công.'],
    update: ['bulk_import_success_update', 'Đã cập nhật {count} nhân viên thành công.'],
    mixed: ['bulk_import_success_mixed', 'Đã thêm mới {createCount} và cập nhật {updateCount} nhân viên thành công.'],
    generic: ['bulk_import_success', 'Import nhân viên thành công.']
}

const extensions = new Set(['.xlsx', '.xls', '.xlsm'])
const mimeTypes = new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.ms-excel.sheet.macroenabled.12'])
const display = (value?: string | null) => value?.trim() || '-'
const validFile = (file: File): FileError | null => {
    const mime = file.type.trim().toLowerCase()
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    return extensions.has(extension) && (!mime || mime === 'application/octet-stream' || mimeTypes.has(mime)) ? null : { code: 'file-invalid-type', message: 'Accepted formats: .xlsx, .xls, .xlsm' }
}

// One screen for both add and update: server validation already decides Create vs Update per
// row via `action` — a single Excel file can contain a mix of both, so the UI never asks the
// user to pick a mode up front.
const StaffBulkImportPage = ({ dictionary, session, locale }: Props) => {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const [file, setFile] = useState<File | null>(null)
    const [inspection, setInspection] = useState<StaffImportSourceInspection | null>(null)
    const [validation, setValidation] = useState<StaffImportValidationResult | null>(null)
    const [downloading, setDownloading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [importing, setImporting] = useState(false)
    const t = useCallback((key: string, fallback: string) => staffText(dictionary, key, fallback), [dictionary])
    const title = t('bulk_import_title', 'Thêm/Cập nhật nhiều nhân viên')

    const onDrop = useCallback((files: File[]) => { setFile(files[0] ?? null); setInspection(null); setValidation(null) }, [])
    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop, multiple: false, noClick: true, validator: validFile,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls', '.xlsm'], 'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'] },
        onDropRejected: () => SwalAlert('warning', t('import_invalid_file_type', 'Chỉ hỗ trợ file .xlsx, .xls hoặc .xlsm.'), 'center')
    })

    const download = useCallback(async () => {
        setDownloading(true)
        try {
            const result = await downloadStaffImportTemplate(); const url = URL.createObjectURL(result.blob); const anchor = document.createElement('a')
            anchor.href = url; anchor.download = result.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url)
        } catch (error) { SwalAlert('error', error instanceof Error ? error.message : t('import_template_download_failed', 'Không thể tải file mẫu import nhân viên.'), 'center') } finally { setDownloading(false) }
    }, [t])
    const validate = useCallback(async () => {
        if (!file || validating) return
        setValidating(true); setValidation(null)
        try {
            const result = await validateStaffImportFile(file)
            try { setInspection(await inspectStaffImportFile(file)) } catch { setInspection(null) }
            setValidation(result)
        } catch (error) { SwalAlert('error', error instanceof Error ? error.message : t('import_validate_failed', 'Không thể kiểm tra file import nhân viên.'), 'center') } finally { setValidating(false) }
    }, [file, validating, t])

    const rows = useMemo(() => validation?.rows ?? [], [validation])
    const users = validation ? getValidatedStaffImportUsers(validation) : []
    const canSubmit = Boolean(validation) && !importing && validation!.error_rows === 0 && users.length > 0
    const createCount = validation?.create_count ?? 0
    const updateCount = validation?.update_count ?? 0
    const submitLabel = describeCounts(t, createCount, updateCount, SUBMIT_LABEL_KEYS)

    const submit = useCallback(() => {
        if (!validation || !canSubmit) return
        const execute = async () => {
            setImporting(true)
            try {
                await submitStaffImport({ duplicate_policy: 'Update', users: getValidatedStaffImportUsers(validation) })
                SwalAlert('success', '', 'center', false, false, true, () => router.push(`/${locale}/users/staffs`), t('bulk_import_back_to_list', 'Quay lại danh sách'), { title: describeCounts(t, createCount, updateCount, SUCCESS_MESSAGE_KEYS) })
            } catch (error) {
                const execution_id = error instanceof StaffImportSubmitError ? error.execution_id ?? undefined : undefined
                SwalAlert('error', { message: error instanceof Error ? error.message : t('bulk_import_failed', 'Không thể import nhân viên.'), execution_id }, 'center')
            } finally { setImporting(false) }
        }
        SwalAlert('warning', describeCounts(t, createCount, updateCount, CONFIRM_MESSAGE_KEYS), 'center', false, true, true, () => void execute(), t('bulk_import_confirm_button', 'Thực hiện'))
    }, [validation, canSubmit, router, locale, t, createCount, updateCount])

    return <ContentWrapper title={title} description={t('bulk_import_description', 'Tải file Excel theo mẫu để thêm hoặc cập nhật nhiều nhân viên.')} icon={<GroupIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary} actions={<StaffImportTour dictionary={dictionary} userCode={session?.user?.email} hasSelectedProject={Boolean(workingProject)} />}>
        <RequireWorkingProject dictionary={dictionary} sessiontoken={session?.user?.token ?? undefined} language={locale}><Stack spacing={3} sx={{ my: 5 }}>
            <Box data-tour="staff-import-template"><Button variant="outlined" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />} onClick={() => void download()} disabled={downloading}>{t('import_download_template', 'Tải file mẫu')}</Button></Box>
            <Paper variant="outlined" data-tour="staff-import-upload" sx={{ p: { xs: 3, md: 5 }, borderStyle: 'dashed', borderWidth: 2, borderColor: isDragActive ? 'primary.main' : 'divider', bgcolor: isDragActive ? 'action.hover' : 'background.paper' }}><Box {...getRootProps()} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center', minHeight: 220, cursor: 'pointer' }}><input {...getInputProps()} /><UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} /><Typography variant="h6">{t('import_upload_title', 'Tải file Excel')}</Typography><Typography variant="body2" color="text.secondary">{t('import_upload_hint', 'Kéo thả file Excel vào đây hoặc nhấn nút bên dưới để chọn file.')}</Typography><Button variant="contained" onClick={open}>{t('import_choose_file', 'Chọn file')}</Button><Typography variant="caption" color="text.secondary">{t('import_upload_accept', 'Chấp nhận định dạng: .xlsx, .xls, .xlsm')}</Typography></Box></Paper>
            <Box sx={{ border: '1px solid', borderColor: file ? 'primary.main' : 'divider', borderRadius: 2, px: 3, py: 2.5, bgcolor: file ? 'action.hover' : 'background.paper' }}><Typography variant="subtitle2" color="text.secondary">{t('import_selected_file_label', 'File đã chọn')}</Typography><Typography>{file?.name ?? t('import_no_file_selected', 'Chưa chọn file')}</Typography>{validation ? <Typography variant="caption" color="text.secondary">{[inspection?.sheet_name, `${validation.total_rows ?? 0} ${t('import_rows', 'dòng')}`].filter(Boolean).join(' • ')}</Typography> : inspection?.sheet_name && <Typography variant="caption" color="text.secondary">{inspection.sheet_name}</Typography>}</Box>
            {validation && ((validation.error_rows ?? 0) > 0
                ? <Alert severity="error">{t('import_validation_has_errors', 'File có dòng dữ liệu lỗi. Vui lòng kiểm tra lại trước khi import.')}</Alert>
                : <Alert severity="success">{t('import_validation_all_valid', 'Toàn bộ dữ liệu hợp lệ, bạn có thể tiếp tục import.')}</Alert>)}
            {validation && <Paper variant="outlined" sx={{ p: 3 }} data-tour="staff-import-summary"><Stack spacing={2}><Typography variant="h6" sx={{ fontWeight: 800 }}>{t('import_preview_title', 'Kết quả kiểm tra dữ liệu')}</Typography><Stack direction={{ xs: 'column', md: 'row' }} spacing={1} flexWrap="wrap" useFlexGap><Chip label={`${t('import_summary_total_rows', 'Tổng số dòng')}: ${validation.total_rows ?? 0}`} /><Chip color="success" variant="outlined" label={`${t('import_summary_valid_rows', 'Dòng hợp lệ')}: ${validation.valid_rows ?? 0}`} /><Chip color={validation.error_rows ? 'error' : 'default'} variant="outlined" label={`${t('import_summary_error_rows', 'Dòng lỗi')}: ${validation.error_rows ?? 0}`} /></Stack><Box sx={{ overflowX: 'auto' }}><Table stickyHeader size="small" sx={{ minWidth: 1400 }}><TableHead><TableRow>{[t('import_preview_row_number', 'Dòng'), t('import_preview_action', 'Hành động'), t('import_preview_status', 'Trạng thái'), t('field_login_name', 'Tên đăng nhập'), t('field_full_name', 'Họ tên'), t('field_phone', 'Điện thoại'), t('field_email', 'Email'), t('bulk_update_changes', 'Dữ liệu thay đổi'), t('import_preview_errors_warnings', 'Lỗi / Cảnh báo')].map(label => <TableCell key={label} sx={{ fontWeight: 800 }}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row, index) => <TableRow key={`${row.row_number}-${index}`}><TableCell>{row.row_number}</TableCell><TableCell><Chip size="small" variant="outlined" color={row.action.toUpperCase() === 'CREATE' ? 'info' : row.action.toUpperCase() === 'UPDATE' ? 'warning' : 'default'} label={row.action.toUpperCase() === 'CREATE' ? t('import_action_create', 'Tạo mới') : row.action.toUpperCase() === 'UPDATE' ? t('import_action_update', 'Cập nhật') : display(row.action)} /></TableCell><TableCell><Chip size="small" color={row.status.toUpperCase() === 'VALID' ? 'success' : 'error'} label={row.status.toUpperCase() === 'VALID' ? t('import_status_valid', 'Hợp lệ') : t('import_status_invalid', 'Không hợp lệ')} /></TableCell><TableCell>{display(row.user_name)}</TableCell><TableCell>{display(row.full_name)}</TableCell><TableCell>{display(row.phone)}</TableCell><TableCell>{display(row.email)}</TableCell><TableCell>{row.changes.length ? row.changes.join(', ') : '-'}</TableCell><TableCell>{[...row.errors, ...row.warnings].map((message, i) => <Typography key={i} variant="body2" color={i < row.errors.length ? 'error.main' : 'warning.main'}>• {message}</Typography>)}{row.errors.length + row.warnings.length === 0 && '-'}</TableCell></TableRow>)}</TableBody></Table></Box></Stack></Paper>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><Button variant="outlined" onClick={() => void validate()} disabled={!file || validating || importing} startIcon={validating ? <CircularProgress size={16} color="inherit" /> : undefined} data-tour="staff-import-validate">{validating ? t('import_validating', 'Đang kiểm tra...') : t('import_validate_data', 'Kiểm tra dữ liệu')}</Button>{validation && <Button variant="contained" onClick={submit} disabled={!canSubmit} startIcon={importing ? <CircularProgress size={16} color="inherit" /> : undefined} data-tour="staff-import-submit">{importing ? t('bulk_importing', 'Đang import...') : submitLabel}</Button>}<Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}/users/staffs`)} disabled={importing}>{t('back_to_list', 'Quay lại danh sách')}</Button></Stack>
        </Stack></RequireWorkingProject>
    </ContentWrapper>
}

export default StaffBulkImportPage
