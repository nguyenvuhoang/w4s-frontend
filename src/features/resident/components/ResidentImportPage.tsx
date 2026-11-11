'use client'

import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import type { MouseEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { FileError } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import SwalAlert from '@/shared/utils/SwalAlert'
import { residentService } from '../services/residentService'
import { ResidentImportValidationRow, ResidentImportValidationSummary, ResidentPageProps } from '../types'
import {
    buildResidentImportPayloadRow,
    parseResidentImportClipboardText,
    validateRow,
    type ResidentImportClipboardMessages
} from '../utils/residentImport'
import {
    applyResidentImportRowToWorkbook,
    downloadResidentImportWorkbook,
    exportResidentImportWorkbookAsFile,
    parseResidentImportWorkbook,
    type ResidentImportWorkbookContext
} from '../utils/residentImportWorkbook'
import { ResidentDictionary, text } from '../utils/residentLabels'
import ResidentImportPreviewTable, { type ResidentImportEditableValues } from './resident-import/ResidentImportPreviewTable'
import ResidentImportTour from './resident-import/ResidentImportTour'

type ImportSourceMode = 'file' | 'clipboard'

const RESIDENT_IMPORT_FILE_EXTENSIONS = new Set([
    '.xlsx',
    '.xls',
    '.xlsm'
])

const RESIDENT_IMPORT_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroenabled.12'
])

const getResidentImportFileExtension = (fileName?: string | null) => {
    if (typeof fileName !== 'string' || !fileName.trim()) return ''

    const normalizedFileName = fileName.trim()
    const dotIndex = normalizedFileName.lastIndexOf('.')

    return dotIndex >= 0
        ? normalizedFileName.slice(dotIndex).toLowerCase()
        : ''
}

const isResidentImportFileSupported = (file: File): boolean => {
    const extension = getResidentImportFileExtension(file?.name)
    const mimeType = file?.type?.trim().toLowerCase() ?? ''
    const hasValidExtension = RESIDENT_IMPORT_FILE_EXTENSIONS.has(extension)
    const hasAcceptableMimeType =
        !mimeType
        || mimeType === 'application/octet-stream'
        || RESIDENT_IMPORT_MIME_TYPES.has(mimeType)

    return hasValidExtension && hasAcceptableMimeType
}

const validateResidentImportFileType = (file: File): FileError | null => {
    if (isResidentImportFileSupported(file)) return null

    return {
        code: 'file-invalid-type',
        message: 'Chỉ hỗ trợ file .xlsx, .xls hoặc .xlsm'
    }
}

export default function ResidentImportPage({ dictionary, session, locale }: ResidentPageProps) {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const projectCode = workingProject?.code || ''
    const dictCommon = useMemo(() => dictionary['common'] || ({} as Record<string, string>), [dictionary])
    const dict = useMemo(() => dictionary['resident'] || ({} as ResidentDictionary), [dictionary])
    const [importSourceMode, setImportSourceMode] = useState<ImportSourceMode>('file')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [clipboardText, setClipboardText] = useState('')
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
    const [isValidatingFile, setIsValidatingFile] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [validationSummary, setValidationSummary] = useState<ResidentImportValidationSummary | null>(null)
    const [savingRowNumber, setSavingRowNumber] = useState<number | null>(null)
    const [hasEditableWorkbook, setHasEditableWorkbook] = useState(false)
    const [isDownloadingEditedFile, setIsDownloadingEditedFile] = useState(false)
    // Holds the parsed ExcelJS workbook for the currently uploaded file (file mode only) so row
    // edits can be written back into the exact original cells and re-exported preserving format.
    const workbookContextRef = useRef<ResidentImportWorkbookContext | null>(null)

    const serviceOptions = useMemo(() => ({
        sessiontoken: session?.user?.token as string | undefined,
        language: locale,
        project_code: projectCode
    }), [locale, projectCode, session?.user?.token])

    const clipboardMessages: ResidentImportClipboardMessages = useMemo(() => ({
        clipboardSourceName: text(dict, 'import_clipboard_source_name', 'Pasted data from Excel'),
        clipboardEmpty: text(dict, 'import_clipboard_empty', 'Please paste Excel data before reading.'),
        clipboardMissingHeaders: text(dict, 'import_clipboard_missing_headers', 'Missing required columns: {columns}.'),
        clipboardNoRows: text(dict, 'import_clipboard_no_rows', 'No resident rows found in pasted data.'),
        clipboardTooManyColumns: text(dict, 'import_clipboard_too_many_columns', 'Row {row} has more columns than the header.'),
        clipboardInvalidIsOwner: text(dict, 'import_clipboard_invalid_is_owner', 'IsOwner must be Y, YES, TRUE, 1, N, NO, FALSE, 0, or empty.'),
        validationRequired: text(dict, 'validation_required', '{field} is required'),
        validationEmail: text(dict, 'validation_email', 'Email format is invalid'),
        validationInvalidDate: text(dict, 'import_validation_invalid_date', 'Date must be valid and use yyyy-MM-dd format.'),
        validationInvalidGender: text(dict, 'import_validation_invalid_gender', 'Gender is not supported.'),
        validationInvalidRelationship: text(dict, 'import_validation_invalid_relationship', 'Relationship type is not supported.')
    }), [dict])

    const resetImportData = useCallback(() => {
        setSelectedFile(null)
        setClipboardText('')
        setValidationSummary(null)
        setHasEditableWorkbook(false)
        setSavingRowNumber(null)
        workbookContextRef.current = null
    }, [])

    const handleImportSourceModeChange = useCallback((_event: MouseEvent<HTMLElement>, value: ImportSourceMode | null) => {
        if (!value || value === importSourceMode) return

        setImportSourceMode(value)
        resetImportData()
    }, [importSourceMode, resetImportData])

    const handleBack = useCallback(async () => {
        if (!validationSummary) {
            router.push(`/${locale}/resident/create`)

            return
        }

        SwalAlert(
            'warning',
            text(
                dict,
                'import_back_confirm_message',
                'If you go back, all validated data will be discarded. Are you sure you want to go back?'
            ),
            'center',
            false,
            true,
            true,
            () => router.push(`/${locale}/resident/create`),
            dictCommon.confirm ?? 'Confirm'
        )

    }, [dict, dictCommon.cancel, dictCommon.confirm, locale, router, validationSummary])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]

        if (!file) return

        setImportSourceMode('file')
        setSelectedFile(file)
        setClipboardText('')
        setValidationSummary(null)
        setHasEditableWorkbook(false)
        workbookContextRef.current = null
    }, [])

    const onDropRejected = useCallback(() => {
        SwalAlert('warning', text(dict, 'import_invalid_file_type', 'Accepted formats: .xlsx, .xls, .xlsm'), 'center')
    }, [dict])

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        onDropRejected,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls', '.xlsm'],
            'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
        },
        validator: validateResidentImportFileType,
        multiple: false,
        noClick: true
    })

    const handleDownloadTemplate = useCallback(async () => {
        setIsDownloadingTemplate(true)

        try {
            const { blob, filename } = await residentService.downloadResidentImportTemplate(serviceOptions)
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')

            link.href = url
            link.download = filename || 'resident-import-template.xlsx'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error: any) {
            const downloadErrorMessage = String(error?.message ?? '').trim()

            SwalAlert(
                'error',
                downloadErrorMessage && downloadErrorMessage !== 'Failed to fetch'
                    ? downloadErrorMessage
                    : dictCommon.servererror
                    ?? text(dict, 'import_api_pending', 'Unable to download template.'),
                'center'
            )
        } finally {
            setIsDownloadingTemplate(false)
        }
    }, [dict, dictCommon.servererror, serviceOptions])

    const handleValidateData = useCallback(async () => {
        if (!projectCode) {
            SwalAlert('warning', text(dict, 'import_project_required', 'Please select a project to continue.'), 'center')
            return
        }

        setValidationSummary(null)
        setHasEditableWorkbook(false)
        workbookContextRef.current = null

        if (importSourceMode === 'clipboard') {
            try {
                const summary = parseResidentImportClipboardText(clipboardText, clipboardMessages)

                setValidationSummary(summary)
            } catch (error: any) {
                SwalAlert('error', String(error?.message ?? text(dict, 'import_clipboard_parse_failed', 'Unable to read pasted Excel data.')), 'center')
            }

            return
        }

        if (!selectedFile) {
            SwalAlert('warning', text(dict, 'import_select_file_required', 'Please select an Excel file first.'), 'center')
            return
        }

        setIsValidatingFile(true)

        try {
            const summary = await residentService.validateResidentImportFile(selectedFile, serviceOptions)

            try {
                workbookContextRef.current = await parseResidentImportWorkbook(selectedFile)
                setHasEditableWorkbook(true)
            } catch {
                // Inline row editing / re-downloading the edited file is only possible when the
                // uploaded file can be parsed client-side (e.g. legacy .xls files cannot) — fall
                // back to the existing read-only preview instead of failing the whole validation.
                workbookContextRef.current = null
                setHasEditableWorkbook(false)
            }

            setValidationSummary(summary)
        } catch (error: any) {
            SwalAlert(
                'error',
                String(error?.message ?? '').trim()
                || dictCommon.servererror
                || text(dict, 'import_validate_failed', 'Unable to validate resident import file.'),
                'center'
            )
        } finally {
            setIsValidatingFile(false)
        }
    }, [clipboardMessages, clipboardText, dict, dictCommon.servererror, importSourceMode, projectCode, selectedFile, serviceOptions])

    // Row edits are always saved through the same validate workflow used for the initial upload:
    // in file mode, the edit is written into the held workbook, re-exported to a File, and that
    // File is re-submitted to the backend validator so the row (and any cross-row rules such as
    // duplicates) are re-checked with the exact same rules as the original upload. In clipboard
    // mode there is no backend call to begin with, so the row is re-validated locally instead.
    const handleSaveRow = useCallback(async (rowNumber: number, values: ResidentImportEditableValues): Promise<boolean> => {
        if (!validationSummary) return false

        const currentRow = validationSummary.rows.find(row => row.row_number === rowNumber)

        if (!currentRow) return false

        setSavingRowNumber(rowNumber)

        try {
            if (importSourceMode === 'file' && workbookContextRef.current) {
                const updatedRow: ResidentImportValidationRow = { ...currentRow, ...values }

                applyResidentImportRowToWorkbook(workbookContextRef.current, updatedRow)

                const fileName = selectedFile?.name || validationSummary.file_name || 'resident-import.xlsx'
                const regeneratedFile = await exportResidentImportWorkbookAsFile(workbookContextRef.current, fileName)
                const freshSummary = await residentService.validateResidentImportFile(regeneratedFile, serviceOptions)

                setSelectedFile(regeneratedFile)
                setValidationSummary(freshSummary)
            } else {
                const updatedRow: ResidentImportValidationRow = { ...currentRow, ...values }

                updatedRow.errors = validateRow(updatedRow, clipboardMessages)
                updatedRow.status = updatedRow.errors.length > 0 ? 'INVALID' : 'VALID'

                const nextRows = validationSummary.rows.map(row => (row.row_number === rowNumber ? updatedRow : row))

                setValidationSummary({
                    ...validationSummary,
                    rows: nextRows,
                    valid_rows: nextRows.filter(row => row.status === 'VALID').length,
                    error_rows: nextRows.filter(row => row.status !== 'VALID').length
                })
            }

            return true
        } catch (error: any) {
            SwalAlert(
                'error',
                String(error?.message ?? '').trim()
                || dictCommon.servererror
                || text(dict, 'import_row_save_failed', 'Unable to save the edited row.'),
                'center'
            )

            return false
        } finally {
            setSavingRowNumber(null)
        }
    }, [clipboardMessages, dict, dictCommon.servererror, importSourceMode, selectedFile, serviceOptions, validationSummary])

    const handleDownloadEditedFile = useCallback(async () => {
        if (!workbookContextRef.current) return

        setIsDownloadingEditedFile(true)

        try {
            const fileName = selectedFile?.name || validationSummary?.file_name || 'resident-import-edited.xlsx'

            await downloadResidentImportWorkbook(workbookContextRef.current, fileName)
        } catch (error: any) {
            SwalAlert(
                'error',
                String(error?.message ?? '').trim()
                || dictCommon.servererror
                || text(dict, 'import_download_edited_failed', 'Unable to download the edited file.'),
                'center'
            )
        } finally {
            setIsDownloadingEditedFile(false)
        }
    }, [dict, dictCommon.servererror, selectedFile, validationSummary])

    const handleClipboardTextChange = useCallback((value: string) => {
        setClipboardText(value)
        setValidationSummary(null)
    }, [])

    const handleClearClipboardText = useCallback(() => {
        setClipboardText('')
        setValidationSummary(null)
    }, [])

    const handleImport = useCallback(() => {
        if (isImporting) return

        if (!projectCode) {
            SwalAlert(
                'warning',
                text(dict, 'import_project_required', 'Please select a project to continue.'),
                'center'
            )

            return
        }

        if (!validationSummary) {
            SwalAlert(
                'warning',
                text(dict, 'import_validate_data', 'Validate Data'),
                'center'
            )

            return
        }

        if (validationSummary.error_rows > 0) {
            SwalAlert(
                'warning',
                text(dict, 'import_validate_failed', 'Unable to validate resident import file.'),
                'center'
            )

            return
        }

        const validRows = validationSummary.rows.filter(row => row.status === 'VALID')

        if (validRows.length === 0) {
            SwalAlert(
                'warning',
                text(dict, 'import_no_valid_rows', 'No valid resident rows to import.'),
                'center'
            )

            return
        }

        if (validRows.some(row => !row.apartment_code?.trim())) {
            SwalAlert(
                'warning',
                text(
                    dict,
                    'import_missing_apartment_code',
                    'Some valid rows are missing apartment code. Please validate the file again.'
                ),
                'center'
            )

            return
        }

        if (validRows.some(row => !row.full_name?.trim())) {
            SwalAlert(
                'warning',
                text(dict, 'import_validate_failed', 'Unable to validate resident import file.'),
                'center'
            )

            return
        }

        const executeImport = async () => {
            setIsImporting(true)

            try {
                const response = await residentService.importResidents(
                    validRows.map(row => buildResidentImportPayloadRow(row)),
                    serviceOptions
                )

                const importedCount = Number(
                    (response as any)?.payload?.dataresponse?.data?.imported_count
                    ?? (response as any)?.payload?.dataresponse?.data?.success_count
                    ?? (response as any)?.payload?.dataresponse?.data?.total_count
                    ?? (response as any)?.payload?.dataresponse?.data?.count
                    ?? validRows.length
                )

                SwalAlert(
                    'success',
                    text(
                        dict,
                        'import_success',
                        'Imported {n} residents successfully.'
                    ).replace(
                        '{n}',
                        String(
                            Number.isFinite(importedCount)
                                ? importedCount
                                : validRows.length
                        )
                    ),
                    'center'
                )

                setSelectedFile(null)
                setClipboardText('')
                setValidationSummary(null)
                setHasEditableWorkbook(false)
                workbookContextRef.current = null
            } catch (error: unknown) {
                SwalAlert('error', error, 'center')
            } finally {
                setIsImporting(false)
            }
        }

        const confirmMessage = text(
            dict,
            'import_confirm_message',
            'Are you sure you want to import {n} residents?'
        ).replace('{n}', String(validRows.length))

        SwalAlert(
            'question',
            confirmMessage,
            'center',
            false,
            true,
            true,
            () => {
                void executeImport()
            },
            dictCommon.confirm ?? 'Confirm'
        )
    }, [
        dict,
        dictCommon.confirm,
        isImporting,
        projectCode,
        serviceOptions,
        validationSummary
    ])

    const canImport = Boolean(
        projectCode
        && validationSummary
        && !isValidatingFile
        && !isImporting
        && validationSummary.total_rows > 0
        && validationSummary.error_rows === 0
        && validationSummary.valid_rows > 0
    )
    const hasValidated = Boolean(validationSummary)
    const canValidate = importSourceMode === 'file'
        ? Boolean(projectCode && selectedFile && !isValidatingFile && !hasValidated)
        : Boolean(projectCode && clipboardText && !isValidatingFile && !hasValidated)

    // Error/invalid rows always sort to the top so the user can find and fix them first; Array.sort
    // is stable, so rows within the same status group keep their original relative order.
    const sortedRows = useMemo(() => {
        if (!validationSummary) return []

        return [...validationSummary.rows].sort((a, b) => {
            const weight = (row: ResidentImportValidationRow) => (row.status === 'VALID' ? 1 : 0)

            return weight(a) - weight(b)
        })
    }, [validationSummary])

    const canDownloadEditedFile = importSourceMode === 'file' && hasEditableWorkbook

    return (
        <ContentWrapper
            title={text(dict, 'import_title', 'Bulk Add Residents')}
            description={text(dict, 'import_description', 'Upload an Excel file from the template to create multiple resident profiles at once.')}
            icon={<ApartmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            actions={
                <ResidentImportTour
                    dictionary={dictionary}
                    userCode={session?.user?.email}
                    hasSelectedProject={Boolean(workingProject)}
                    isBusy={isValidatingFile || isImporting}
                    canDownloadEditedFile={canDownloadEditedFile}
                />
            }
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={session?.user?.token ?? undefined} language={locale}>
                <Stack spacing={3} sx={{ my: 5 }}>
                    <Box data-tour="resident-import-template">
                        <Button
                            variant="outlined"
                            startIcon={isDownloadingTemplate ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                            onClick={handleDownloadTemplate}
                            disabled={isDownloadingTemplate}
                        >
                            {text(dict, 'import_download_template', 'Download Template')}
                        </Button>
                    </Box>

                    <ToggleButtonGroup
                        exclusive
                        value={importSourceMode}
                        onChange={handleImportSourceModeChange}
                        color="primary"
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                        data-tour="resident-import-source"
                    >
                        <ToggleButton value="file">
                            <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
                            {text(dict, 'import_mode_file', 'Upload Excel File')}
                        </ToggleButton>
                        <ToggleButton value="clipboard">
                            <ContentPasteIcon fontSize="small" sx={{ mr: 1 }} />
                            {text(dict, 'import_mode_clipboard', 'Paste from Excel')}
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {importSourceMode === 'file' ? (
                        <Paper
                            variant="outlined"
                            data-tour="resident-import-upload"
                            sx={{
                                p: { xs: 3, md: 5 },
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                borderColor: isDragActive ? 'primary.main' : 'divider',
                                backgroundColor: isDragActive ? 'action.hover' : 'background.paper'
                            }}
                        >
                            <Box
                                {...getRootProps()}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    textAlign: 'center',
                                    minHeight: 220,
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    {...getInputProps({
                                        accept: '.xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroEnabled.12'
                                    })}
                                />
                                <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                                <Typography variant="h6">
                                    {text(dict, 'import_upload_title', 'Upload Excel File')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {text(dict, 'import_upload_hint', 'Drag and drop an Excel file here, or click the button below to choose a file.')}
                                </Typography>
                                <Button variant="contained" onClick={open}>
                                    {text(dict, 'import_choose_file', 'Choose File')}
                                </Button>
                                <Typography variant="caption" color="text.secondary">
                                    {text(dict, 'import_upload_accept', 'Accepted formats: .xlsx, .xls, .xlsm')}
                                </Typography>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                borderColor: clipboardText ? 'primary.main' : 'divider',
                                backgroundColor: 'action.hover'
                            }}
                        >
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <ContentPasteIcon color="action" />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            {text(dict, 'import_clipboard_title', 'Paste from Excel')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {text(dict, 'import_clipboard_hint', 'Copy rows from Excel or Google Sheets and paste them here.')}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <TextField
                                    value={clipboardText}
                                    onChange={(event) => handleClipboardTextChange(event.target.value)}
                                    onPaste={() => setValidationSummary(null)}
                                    multiline
                                    minRows={6}
                                    maxRows={10}
                                    fullWidth
                                    placeholder={text(dict, 'import_clipboard_placeholder', 'Paste tab-separated Excel data here.')}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        onClick={handleValidateData}
                                        disabled={!canValidate}
                                        startIcon={isValidatingFile ? <CircularProgress size={16} color="inherit" /> : undefined}
                                    >
                                        {text(dict, 'import_clipboard_read_data', 'Read Data')}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={handleClearClipboardText}
                                        disabled={!clipboardText && !validationSummary}
                                    >
                                        {text(dict, 'import_clipboard_clear_data', 'Clear Data')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    )}

                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: selectedFile || (importSourceMode === 'clipboard' && validationSummary) ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            px: 3,
                            py: 2.5,
                            bgcolor: selectedFile || (importSourceMode === 'clipboard' && validationSummary) ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                            transition: 'all 0.25s ease',
                            ...((selectedFile || (importSourceMode === 'clipboard' && validationSummary)) && {
                                animation: 'residentSelectedFilePulse 1.8s ease-in-out infinite',
                                '@keyframes residentSelectedFilePulse': {
                                    '0%': {
                                        boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.28)'
                                    },
                                    '70%': {
                                        boxShadow: '0 0 0 6px rgba(25, 118, 210, 0)'
                                    },
                                    '100%': {
                                        boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
                                    }
                                }
                            })
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {importSourceMode === 'clipboard'
                                ? text(dict, 'import_selected_source_label', 'Selected source')
                                : text(dict, 'import_selected_file_label', 'Selected file')}
                        </Typography>
                        <Typography variant="body1">
                            {importSourceMode === 'clipboard'
                                ? validationSummary?.file_name || text(dict, 'import_no_clipboard_data', 'No pasted data read')
                                : selectedFile?.name || text(dict, 'import_no_file_selected', 'No file selected')}
                        </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={handleValidateData}
                            disabled={!canValidate}
                            startIcon={isValidatingFile ? <CircularProgress size={16} color="inherit" /> : undefined}
                            data-tour="resident-import-validate"
                        >
                            {isValidatingFile
                                ? text(dict, 'import_validating', 'Validating...')
                                : hasValidated
                                    ? text(dict, 'import_validated', 'Validated')
                                    : text(dict, 'import_validate_data', 'Validate Data')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={!canImport}
                            startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}
                            data-tour="resident-import-submit"
                        >
                            {isImporting
                                ? text(dict, 'import_processing', 'Importing...')
                                : text(dict, 'import_submit', 'Import')}
                        </Button>
                        {canDownloadEditedFile && (
                            <Button
                                variant="outlined"
                                onClick={() => void handleDownloadEditedFile()}
                                disabled={isDownloadingEditedFile}
                                startIcon={isDownloadingEditedFile ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                data-tour="resident-import-download-edited"
                            >
                                {text(dict, 'import_download_edited_file', 'Download Edited File')}
                            </Button>
                        )}
                        <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
                            {text(dict, 'import_back_to_create', 'Back')}
                        </Button>
                    </Stack>

                    {validationSummary && (
                        <Stack spacing={2}>
                            <Paper variant="outlined" sx={{ p: 3 }} data-tour="resident-import-summary">
                                <Stack spacing={2}>
                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                        {text(dict, 'import_preview_title', 'Validation Preview')}
                                    </Typography>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            color="default"
                                            variant="outlined"
                                            label={`${text(dict, 'import_summary_file', 'File')}: ${validationSummary.file_name || '-'}`}
                                        />
                                        <Chip
                                            color="default"
                                            variant="outlined"
                                            label={`${text(dict, 'import_summary_total_rows', 'Total Rows')}: ${validationSummary.total_rows}`}
                                        />
                                        <Chip
                                            color="success"
                                            variant="outlined"
                                            label={`${text(dict, 'import_summary_valid_rows', 'Valid Rows')}: ${validationSummary.valid_rows}`}
                                        />
                                        <Chip
                                            color={validationSummary.error_rows > 0 ? 'error' : 'default'}
                                            variant="outlined"
                                            label={`${text(dict, 'import_summary_error_rows', 'Error Rows')}: ${validationSummary.error_rows}`}
                                        />
                                    </Stack>
                                </Stack>
                            </Paper>

                            <Box data-tour="resident-import-table">
                                <ResidentImportPreviewTable
                                    dict={dict}
                                    rows={sortedRows}
                                    // Editing a failed row must always be possible — it must never depend on
                                    // whether the uploaded file could be parsed into a workbook client-side
                                    // (hasEditableWorkbook only gates the separate "download edited file"
                                    // feature). Only block editing while an import is actually in flight.
                                    canEdit={!isImporting}
                                    savingRowNumber={savingRowNumber}
                                    onSaveRow={handleSaveRow}
                                    sessiontoken={session?.user?.token ?? undefined}
                                    language={locale}
                                    projectId={workingProject?.id ?? null}
                                />
                            </Box>
                        </Stack>
                    )}
                </Stack>
            </RequireWorkingProject>
        </ContentWrapper>
    )
}
