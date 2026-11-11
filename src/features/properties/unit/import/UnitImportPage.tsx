'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import type { ChangeEvent } from 'react'
import type { FileError } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import SwalAlert from '@/shared/utils/SwalAlert'

import { apartmentText, commonText } from '../apartmentHelpers'
import { UNIT_IMPORT_DUPLICATE_POLICY } from './types'
import type { UnitImportPageProps, UnitImportSubmitResult, UnitImportValidationSummary } from './types'
import UnitImportPreviewTable from './components/UnitImportPreviewTable'
import { unitImportService, UnitImportSubmitError, UnitImportTemplateError, UnitImportValidateError } from './services/unitImportService'
import { mapUnitImportBackendValidationResponse } from './utils/unitImportBackendMapper'
import { saveUnitImportTemplate } from './utils/unitImportTemplate'

const UNIT_IMPORT_FILE_EXTENSIONS = new Set(['.xlsx', '.xls', '.xlsm'])
const UNIT_IMPORT_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroenabled.12'
])

const DEFAULT_PREVIEW_PAGE_SIZE = 10

const getFileExtension = (fileName?: string | null) => {
  if (typeof fileName !== 'string' || !fileName.trim()) return ''

  const normalized = fileName.trim()
  const dotIndex = normalized.lastIndexOf('.')

  return dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : ''
}

const isSupportedFile = (file: File): boolean => {
  const extension = getFileExtension(file?.name)
  const mimeType = file?.type?.trim().toLowerCase() ?? ''
  const hasValidExtension = UNIT_IMPORT_FILE_EXTENSIONS.has(extension)
  const hasAcceptableMimeType = !mimeType || mimeType === 'application/octet-stream' || UNIT_IMPORT_MIME_TYPES.has(mimeType)

  return hasValidExtension && hasAcceptableMimeType
}

export default function UnitImportPage({ dictionary, session, locale }: UnitImportPageProps) {
  const router = useRouter()
  const workingProject = useWorkingProject()
  const sessiontoken = session?.user?.token ?? undefined

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  // Synchronous guard: a double click fires before the disabled state re-renders, so it must not start a 2nd request.
  const templateDownloadInFlightRef = useRef(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationSummary, setValidationSummary] = useState<UnitImportValidationSummary | null>(null)
  // Client-side-only pagination over the already-fully-loaded validation result (the API returns
  // every row in one call, e.g. ~728) — page/pageSize never trigger another request, and Import
  // always submits the full validationSummary.apartments list, never just the current page's slice.
  const [previewPageIndex, setPreviewPageIndex] = useState(1)
  const [previewPageSize, setPreviewPageSize] = useState(DEFAULT_PREVIEW_PAGE_SIZE)
  // Root-level `execution_id` from the most recent validate/import API response — a trace code for
  // support/log lookup, kept separate from validationSummary since it must survive even a failed
  // call (the response can carry execution_id alongside an error) and always reflects the latest call.
  const [executionId, setExecutionId] = useState('')
  const [executionIdCopied, setExecutionIdCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
  }, [])

  const t = useCallback((key: string, fallback: string) => apartmentText(dictionary, key, fallback), [dictionary])

  // `execution_id` lives at the response root only — never read from inside `data`.
  const applyExecutionId = useCallback((value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      setExecutionId(value.trim())
    }
  }, [])

  const resetImportData = useCallback(() => {
    setSelectedFile(null)
    setValidationSummary(null)
    setPreviewPageIndex(1)
    setPreviewPageSize(DEFAULT_PREVIEW_PAGE_SIZE)
    setExecutionId('')
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]

    if (!file) return

    setSelectedFile(file)
    setValidationSummary(null)
    setPreviewPageIndex(1)
    setPreviewPageSize(DEFAULT_PREVIEW_PAGE_SIZE)
    setExecutionId('')
  }, [])

  const onDropRejected = useCallback(() => {
    SwalAlert('warning', t('importApartmentInvalidFileType', 'Only .xlsx, .xls or .xlsm files are accepted'), 'center')
  }, [t])

  const validateFileType = useCallback((file: File): FileError | null => {
    if (isSupportedFile(file)) return null

    return {
      code: 'file-invalid-type',
      message: t('importApartmentInvalidFileType', 'Only .xlsx, .xls or .xlsm files are accepted')
    }
  }, [t])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.xlsm'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    validator: validateFileType,
    multiple: false,
    noClick: true,
    // Never let the file change mid-import — an in-flight WF_BO_IMPORT_APARTMENTS call must keep
    // referring to the exact file/validation result it was confirmed against.
    disabled: isImporting
  })

  // Template file from the Backend (POST /ips/api/ImportTemplate/DownloadTemplate through the BFF); the page stays as is.
  const handleDownloadTemplate = useCallback(async () => {
    if (templateDownloadInFlightRef.current) return

    templateDownloadInFlightRef.current = true
    setIsDownloadingTemplate(true)

    try {
      const file = await unitImportService.downloadApartmentImportTemplate({
        language: locale,
        failedMessage: t('importApartmentTemplateDownloadFailed', 'Unable to download the template file.')
      })

      saveUnitImportTemplate(file)
    } catch (error: unknown) {
      if (error instanceof UnitImportTemplateError) {
        SwalAlert('error', { message: error.message, execution_id: error.execution_id ?? undefined }, 'center')
      } else {
        SwalAlert('error', error instanceof Error ? error.message : t('importApartmentTemplateDownloadFailed', 'Unable to download the template file.'), 'center')
      }
    } finally {
      templateDownloadInFlightRef.current = false
      setIsDownloadingTemplate(false)
    }
  }, [locale, t])

  const runValidation = useCallback(async (file: File, projectId: number) => {
    setValidationSummary(null)
    setPreviewPageIndex(1)
    setIsValidating(true)

    try {
      const payload = await unitImportService.validateUnitImportFile(file, {
        sessiontoken,
        language: locale,
        projectId,
        requestFailedMessage: t('importApartmentValidateFailed', 'Unable to validate the apartment import file.')
      })

      applyExecutionId((payload as any)?.execution_id)
      setValidationSummary(mapUnitImportBackendValidationResponse(payload, file.name))
    } catch (error: unknown) {
      if (error instanceof UnitImportValidateError) {
        applyExecutionId(error.execution_id)
        SwalAlert('error', { message: error.message, execution_id: error.execution_id ?? undefined }, 'center')
      } else {
        const fallback = t('importApartmentValidateFailed', 'Unable to validate the apartment import file.')

        SwalAlert('error', error instanceof Error ? error.message : fallback, 'center')
      }
    } finally {
      setIsValidating(false)
    }
  }, [applyExecutionId, locale, sessiontoken, t])

  const handleValidateData = useCallback(() => {
    if (isValidating) return

    // No project_id / project name resolved yet — block validation entirely, do not call the API.
    if (!workingProject?.id || !workingProject?.name) {
      SwalAlert('warning', t('importApartmentProjectRequired', 'Please select a project to continue.'), 'center')

      return
    }

    if (!selectedFile) {
      SwalAlert('warning', t('importApartmentSelectFileRequired', 'Please select an Excel file first.'), 'center')

      return
    }

    const file = selectedFile
    const projectId = workingProject.id

    // Confirm the working project before calling the validation API — cancel closes the alert
    // and issues no request; only confirming runs runValidation.
    SwalAlert(
      'warning',
      t('importApartmentConfirmProjectMessage', 'You are about to validate data for Project {ProjectName}. Please double-check that you are working on the correct project.')
        .replace('{ProjectName}', formatProjectLabel(workingProject)),
      'center',
      false,
      true,
      true,
      () => {
        void runValidation(file, projectId)
      },
      t('importApartmentConfirmProjectContinue', 'Continue Validating'),
      {
        title: t('importApartmentConfirmProjectTitle', 'Confirm Project'),
        cancelButtonText: t('importApartmentConfirmProjectCancel', 'Review Again')
      }
    )
  }, [isValidating, runValidation, selectedFile, t, workingProject])

  const handleBack = useCallback(() => {
    if (!validationSummary) {
      router.push(`/${locale}/properties/unit`)

      return
    }

    SwalAlert(
      'warning',
      t('importApartmentBackConfirm', 'If you go back, all validated data will be discarded. Are you sure you want to go back?'),
      'center',
      false,
      true,
      true,
      () => router.push(`/${locale}/properties/unit`),
      commonText(dictionary, 'confirm', 'Confirm')
    )
  }, [dictionary, locale, router, t, validationSummary])

  // Colors picked directly against the requested rules (green when created/updated > 0, orange for
  // skipped, red/green for error rows) — kept local since they only apply to this one summary table.
  const SUCCESS_COLOR_GREEN = '#16a34a'
  const SUCCESS_COLOR_ORANGE = '#ea580c'
  const SUCCESS_COLOR_RED = '#dc2626'
  const SUCCESS_COLOR_NEUTRAL = '#111827'

  const buildImportSuccessHtml = useCallback((result: UnitImportSubmitResult, fallbackTotal: number) => {
    // Only a row whose count the backend actually returned is shown — "Total submitted" is the one
    // exception, falling back to the submitted item count when the backend omits total_count.
    const total = result.total_count ?? fallbackTotal

    const rows: Array<{ label: string; value: number; color: string }> = [
      { label: t('importApartmentImportSuccessTotal', 'Total submitted'), value: total, color: SUCCESS_COLOR_NEUTRAL }
    ]

    if (result.created_count !== null) {
      rows.push({
        label: t('importApartmentImportSuccessCreated', 'Created'),
        value: result.created_count,
        color: result.created_count > 0 ? SUCCESS_COLOR_GREEN : SUCCESS_COLOR_NEUTRAL
      })
    }

    if (result.updated_count !== null) {
      rows.push({
        label: t('importApartmentImportSuccessUpdated', 'Updated'),
        value: result.updated_count,
        color: result.updated_count > 0 ? SUCCESS_COLOR_GREEN : SUCCESS_COLOR_NEUTRAL
      })
    }

    if (result.skipped_count !== null) {
      rows.push({
        label: t('importApartmentImportSuccessSkipped', 'Skipped'),
        value: result.skipped_count,
        color: SUCCESS_COLOR_ORANGE
      })
    }

    if (result.error_count !== null) {
      rows.push({
        label: t('importApartmentImportSuccessErrors', 'Error rows'),
        value: result.error_count,
        color: result.error_count > 0 ? SUCCESS_COLOR_RED : SUCCESS_COLOR_GREEN
      })
    }

    const rowsHtml = rows.map((row, index) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 6px;${index < rows.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.08);' : ''}">
        <span style="text-align:left;color:#374151;font-size:14px;">${row.label}</span>
        <strong style="text-align:right;font-size:15px;color:${row.color};">${row.value}</strong>
      </div>
    `).join('')

    return `<div style="text-align:left;">${rowsHtml}</div>`
  }, [t])

  const handleImport = useCallback(() => {
    if (isImporting) return

    if (!workingProject?.id || !workingProject?.name) {
      SwalAlert('warning', t('importApartmentProjectRequired', 'Please select a project to continue.'), 'center')

      return
    }

    if (!validationSummary) {
      SwalAlert('warning', t('importApartmentValidateData', 'Validate Data'), 'center')

      return
    }

    if (validationSummary.error_rows > 0) {
      SwalAlert('warning', t('importApartmentHasErrorRows', 'Please resolve all error rows before importing.'), 'center')

      return
    }

    // The backend's own already-validated/normalized apartments[] — never validationSummary.rows
    // (table display model) and never a pagination-sliced subset. Pagination is display-only.
    const items = validationSummary.apartments

    if (items.length === 0) {
      SwalAlert('warning', t('importApartmentNoValidRows', 'No valid rows to import.'), 'center')

      return
    }

    const projectId = workingProject.id
    const projectName = formatProjectLabel(workingProject)

    const executeImport = async () => {
      setIsImporting(true)

      try {
        const result = await unitImportService.submitUnitImport(
          {
            project_id: projectId,
            duplicate_policy: UNIT_IMPORT_DUPLICATE_POLICY,
            items
          },
          {
            sessiontoken,
            language: locale,
            failedMessage: t('importApartmentImportFailed', 'Unable to import apartments.')
          }
        )

        applyExecutionId(result.execution_id)

        SwalAlert(
          'success',
          '',
          'center',
          false,
          false,
          true,
          () => {
            // Only on success, and only once the user has acknowledged the result — a failed
            // import (see catch below) must keep the file/validation result in place instead.
            resetImportData()
            router.push(`/${locale}/properties/unit`)
          },
          t('importApartmentBack', 'Back to Apartment List'),
          {
            title: t('importApartmentImportSuccessBase', 'Apartment import completed successfully.'),
            html: buildImportSuccessHtml(result, items.length),
            width: 520
          }
        )
      } catch (error: unknown) {
        if (error instanceof UnitImportSubmitError) {
          applyExecutionId(error.execution_id)
          SwalAlert('error', { message: error.message, execution_id: error.execution_id ?? undefined }, 'center')
        } else {
          SwalAlert('error', error, 'center')
        }

        // Keep the selected file and validation result so the user can retry without re-uploading.
      } finally {
        setIsImporting(false)
      }
    }

    SwalAlert(
      'warning',
      t('importApartmentImportConfirmMessage', 'You are about to import {totalItems} apartments into Project {ProjectName}. Existing apartments will be updated with the data in the import file.')
        .replace('{totalItems}', String(items.length))
        .replace('{ProjectName}', projectName),
      'center',
      false,
      true,
      true,
      () => {
        void executeImport()
      },
      t('importApartmentSubmit', 'Import'),
      {
        title: t('importApartmentImportConfirmTitle', 'Confirm Apartment Import'),
        cancelButtonText: t('importApartmentConfirmProjectCancel', 'Review Again')
      }
    )
  }, [applyExecutionId, buildImportSuccessHtml, isImporting, locale, resetImportData, router, sessiontoken, t, validationSummary, workingProject])

  const totalRows = validationSummary?.rows.length ?? 0
  const pagedRows = useMemo(() => {
    if (!validationSummary) return []

    const start = (previewPageIndex - 1) * previewPageSize

    return validationSummary.rows.slice(start, start + previewPageSize)
  }, [previewPageIndex, previewPageSize, validationSummary])

  const handlePreviewPageChange = useCallback((_event: ChangeEvent<unknown>, page: number) => {
    setPreviewPageIndex(page)
  }, [])

  const handlePreviewPageSizeChange = useCallback((event: SelectChangeEvent<number>) => {
    setPreviewPageSize(Number(event.target.value))
    setPreviewPageIndex(1)
  }, [])

  const handlePreviewJumpPage = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const totalPages = Math.max(Math.ceil(totalRows / previewPageSize), 1)
    const page = Math.min(Math.max(Number(event.target.value) || 1, 1), totalPages)

    setPreviewPageIndex(page)
  }, [previewPageSize, totalRows])

  const handleCopyExecutionId = useCallback(async () => {
    if (!executionId) return

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.')
      }

      await navigator.clipboard.writeText(executionId)
      setExecutionIdCopied(true)
      SwalAlert('success', t('importApartmentExecutionIdCopySuccess', 'Copied execution ID.'), 'top-end')

      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = setTimeout(() => setExecutionIdCopied(false), 1500)
    } catch {
      SwalAlert('error', t('importApartmentExecutionIdCopyFailed', 'Unable to copy execution ID.'), 'top-end')
    }
  }, [executionId, t])

  const hasValidated = Boolean(validationSummary)
  const canValidate = Boolean(workingProject && selectedFile && !isValidating)
  const canImport = Boolean(
    workingProject
    && validationSummary
    && !isValidating
    && !isImporting
    && validationSummary.total_rows > 0
    && validationSummary.error_rows === 0
    && validationSummary.valid_rows > 0
    && validationSummary.apartments.length > 0
  )

  return (
    <ContentWrapper
      title={t('importApartmentTitle', 'Bulk Add Apartment Profiles')}
      description={t('importApartmentDescription', 'Upload an Excel file from the template to add multiple apartment profiles at once.')}
      icon={<HomeWorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ my: 5 }}>
          <Box>
            <Button
              variant="outlined"
              startIcon={isDownloadingTemplate ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={() => void handleDownloadTemplate()}
              disabled={isDownloadingTemplate}
            >
              {t('importApartmentDownloadTemplate', 'Download Template')}
            </Button>
          </Box>

          <Paper
            variant="outlined"
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
                {t('importApartmentUploadTitle', 'Upload Excel File')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('importApartmentUploadHint', 'Drag and drop an Excel file here, or click the button below to choose a file.')}
              </Typography>
              <Button variant="contained" onClick={open}>
                {t('importApartmentChooseFile', 'Choose File')}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t('importApartmentAcceptedFormat', 'Accepted formats: .xlsx, .xls, .xlsm')}
              </Typography>
            </Box>
          </Paper>

          <Box
            sx={{
              border: '1px solid',
              borderColor: selectedFile ? 'primary.main' : 'divider',
              borderRadius: 2,
              px: 3,
              py: 2.5,
              bgcolor: selectedFile ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('importApartmentSelectedFile', 'Selected file')}
            </Typography>
            <Typography variant="body1">
              {selectedFile?.name || t('importApartmentNoFileSelected', 'No file selected')}
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              onClick={handleValidateData}
              disabled={!canValidate}
              startIcon={isValidating ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {isValidating
                ? t('importApartmentValidating', 'Validating...')
                : hasValidated
                  ? t('importApartmentValidated', 'Validated')
                  : t('importApartmentValidateData', 'Validate Data')}
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={!canImport}
              startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {isImporting
                ? t('importApartmentProcessing', 'Importing...')
                : t('importApartmentSubmit', 'Import')}
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              {t('importApartmentBack', 'Back to Apartment List')}
            </Button>
          </Stack>

          {executionId && (
            <Paper
              variant="outlined"
              sx={{
                px: 2.5,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {t('importApartmentExecutionIdLabel', 'Execution ID')}:
              </Typography>
              <Typography
                component="code"
                variant="body2"
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, minWidth: 0 }}
              >
                {executionId}
              </Typography>
              <Tooltip title={executionIdCopied ? commonText(dictionary, 'copiedErrorReference', 'Copied') : commonText(dictionary, 'copy', 'Copy')}>
                <IconButton size="small" onClick={() => void handleCopyExecutionId()}>
                  {executionIdCopied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Paper>
          )}

          {validationSummary && (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t('importApartmentPreviewTitle', 'Validation Preview')}
                  </Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
                    <Chip
                      color="default"
                      variant="outlined"
                      label={`${t('importApartmentSummaryFile', 'File')}: ${validationSummary.file_name || '-'}`}
                    />
                    <Chip
                      color="default"
                      variant="outlined"
                      label={`${t('importApartmentSummaryTotalRows', 'Total Rows')}: ${validationSummary.total_rows}`}
                    />
                    <Chip
                      color="success"
                      variant="outlined"
                      label={`${t('importApartmentSummaryValidRows', 'Valid Rows')}: ${validationSummary.valid_rows}`}
                    />
                    <Chip
                      color={validationSummary.error_rows > 0 ? 'error' : 'default'}
                      variant="outlined"
                      label={`${t('importApartmentSummaryErrorRows', 'Error Rows')}: ${validationSummary.error_rows}`}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <UnitImportPreviewTable
                dictionary={dictionary}
                rows={pagedRows}
                totalRows={totalRows}
                pageIndex={previewPageIndex}
                pageSize={previewPageSize}
                onPageChange={handlePreviewPageChange}
                onPageSizeChange={handlePreviewPageSizeChange}
                onJumpPage={handlePreviewJumpPage}
              />
            </Stack>
          )}
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}
