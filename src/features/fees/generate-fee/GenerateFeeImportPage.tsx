'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import PostAddIcon from '@mui/icons-material/PostAdd'
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useSearchParams } from 'next/navigation'
import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FileError } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import SwalAlert, { escapeHtml } from '@/shared/utils/SwalAlert'

import { commonText, feeText } from '../components/feeTypeHelpers'
import { GENERATE_FEE_DUPLICATE_POLICY } from './types'
import type { GenerateFeeImportSourceMode, GenerateFeePageProps, GenerateFeeSubmitResult, GenerateFeeValidationSummary } from './types'
import GenerateFeePreviewTable from './components/GenerateFeePreviewTable'
import GenerateFeeSheetViewer from './components/GenerateFeeSheetViewer'
import GenerateFeeSourcePanel from './components/GenerateFeeSourcePanel'
import GenerateFeeSummaryPanel, { type GenerateFeeViewMode } from './components/GenerateFeeSummaryPanel'
import { generateFeeService, GenerateFeeFileValidationError, GenerateFeeSubmitError } from './services/generateFeeService'
import { mapGenerateFeeBackendValidationResponse } from './utils/generateFeeBackendMapper'
import { parseGenerateFeeClipboardText, type GenerateFeeClipboardMessages } from './utils/generateFeeClipboard'
import {
    applyFeeTypeLookupResults,
    buildGenerateFeeRequestItem,
    buildGenerateFeeSummaryTotals,
    markApartmentCodeErrors,
    type GenerateFeeMessages
} from './utils/generateFeeValidation'
import { parseGenerateFeeWorkbookFile } from './utils/generateFeeWorkbook'
import { downloadGenerateFeeTemplate } from './utils/generateFeeTemplate'

const GENERATE_FEE_FILE_EXTENSIONS = new Set(['.xlsx', '.xls', '.xlsm'])
const GENERATE_FEE_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.ms-excel.sheet.macroenabled.12'
])

const getFileExtension = (fileName?: string | null) => {
    if (typeof fileName !== 'string' || !fileName.trim()) return ''

    const normalized = fileName.trim()
    const dotIndex = normalized.lastIndexOf('.')

    return dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : ''
}

const isSupportedFile = (file: File): boolean => {
    const extension = getFileExtension(file?.name)
    const mimeType = file?.type?.trim().toLowerCase() ?? ''
    const hasValidExtension = GENERATE_FEE_FILE_EXTENSIONS.has(extension)
    const hasAcceptableMimeType = !mimeType || mimeType === 'application/octet-stream' || GENERATE_FEE_MIME_TYPES.has(mimeType)

    return hasValidExtension && hasAcceptableMimeType
}

const DEFAULT_PREVIEW_PAGE_SIZE = 10

const GenerateFeeImportPage = ({ dictionary, locale, sessiontoken }: GenerateFeePageProps) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const workingProject = useWorkingProject()
    const requestedProjectId = Number(searchParams.get('project_id'))
    const hasProjectContextMismatch = Number.isInteger(requestedProjectId)
        && requestedProjectId > 0
        && requestedProjectId !== workingProject?.id

    const [title, setTitle] = useState('')
    const [titleTouched, setTitleTouched] = useState(false)
    const [importSourceMode, setImportSourceMode] = useState<GenerateFeeImportSourceMode>('file')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [clipboardText, setClipboardText] = useState('')
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
    const [isValidating, setIsValidating] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [validationSummary, setValidationSummary] = useState<GenerateFeeValidationSummary | null>(null)
    const [viewMode, setViewMode] = useState<GenerateFeeViewMode>('preview')
    const [previewPageIndex, setPreviewPageIndex] = useState(1)
    const [previewPageSize, setPreviewPageSize] = useState(DEFAULT_PREVIEW_PAGE_SIZE)
    const [submitError, setSubmitError] = useState<{ message: string; executionId?: string } | null>(null)
    // Root-level `execution_id` from the most recent validate/import API response — a trace code
    // for support/log lookup, kept separate from submitError since it must survive even a
    // successful call and always reflects the latest one (validate or import, whichever ran last).
    const [executionId, setExecutionId] = useState('')
    const [executionIdCopied, setExecutionIdCopied] = useState(false)
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => () => {
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }, [])

    // `execution_id` lives at the response root (with a `data.execution_id` fallback — see
    // extractBackendExecutionId in generateFeeService.ts) — never solely inside `data`.
    const applyExecutionId = useCallback((value: unknown) => {
        if (typeof value === 'string' && value.trim()) {
            setExecutionId(value.trim())
        }
    }, [])

    const validationFieldMessages: GenerateFeeMessages = useMemo(() => ({
        validationCustomerNameRequired: feeText(dictionary, 'generate_fee_validation_customer_name_required', 'Customer name is required.'),
        validationApartmentRequired: feeText(dictionary, 'generate_fee_validation_apartment_required', 'Customer code is required.'),
        validationBillNumberRequired: feeText(dictionary, 'generate_fee_validation_bill_number_required', 'Bill number is required.'),
        validationDescriptionRequired: feeText(dictionary, 'generate_fee_validation_description_required', 'Description is required.'),
        validationDebitAmountRequired: feeText(dictionary, 'generate_fee_validation_debit_amount_required', 'Remaining amount is required.'),
        validationInvalidDate: feeText(dictionary, 'generate_fee_validation_invalid_date', 'Invalid date.'),
        validationAmountInvalid: feeText(dictionary, 'generate_fee_validation_amount_invalid', 'Value must be a valid number.'),
        validationAmountNegative: feeText(dictionary, 'generate_fee_validation_amount_negative', 'Value must not be negative.'),
        fieldPostingDate: feeText(dictionary, 'generate_fee_field_posting_date', 'Posting Date'),
        fieldDocumentDate: feeText(dictionary, 'generate_fee_field_document_date', 'Document Date'),
        fieldInvoiceDate: feeText(dictionary, 'generate_fee_field_invoice_date', 'Invoice Date'),
        fieldTotalAmount: feeText(dictionary, 'generate_fee_field_total_amount', 'Total Amount'),
        fieldCollectedAmount: feeText(dictionary, 'generate_fee_field_collected_amount', 'Collected Amount'),
        fieldDebitAmount: feeText(dictionary, 'generate_fee_field_debit_amount', 'Remaining Amount')
    }), [dictionary])

    const clipboardMessages: GenerateFeeClipboardMessages = useMemo(() => ({
        ...validationFieldMessages,
        clipboardEmpty: feeText(dictionary, 'generate_fee_clipboard_empty', 'Please paste data before reading.'),
        clipboardNoRows: feeText(dictionary, 'generate_fee_clipboard_no_rows', 'No fee rows found in the pasted data.'),
        clipboardSourceName: feeText(dictionary, 'generate_fee_clipboard_source_name', 'Pasted data from Excel')
    }), [dictionary, validationFieldMessages])

    const resetImportData = useCallback(() => {
        setSelectedFile(null)
        setClipboardText('')
        setValidationSummary(null)
        setSubmitError(null)
        setViewMode('preview')
        setPreviewPageIndex(1)
        setExecutionId('')
    }, [])

    // A validated file belongs to exactly one project scope. Never allow it to survive a
    // working-project switch and later be submitted with the new scope header.
    const previousWorkingProjectIdRef = useRef<number | null>(workingProject?.id ?? null)
    useEffect(() => {
        const nextProjectId = workingProject?.id ?? null

        if (previousWorkingProjectIdRef.current !== nextProjectId) {
            previousWorkingProjectIdRef.current = nextProjectId
            resetImportData()
        }
    }, [resetImportData, workingProject?.id])

    const handleModeChange = useCallback((mode: GenerateFeeImportSourceMode) => {
        if (mode === importSourceMode) return

        setImportSourceMode(mode)
        resetImportData()
    }, [importSourceMode, resetImportData])

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]

        if (!file) return

        setImportSourceMode('file')
        setSelectedFile(file)
        setClipboardText('')
        setValidationSummary(null)
        setSubmitError(null)
        setViewMode('preview')
        setPreviewPageIndex(1)
        setExecutionId('')
    }, [])

    const onDropRejected = useCallback(() => {
        SwalAlert('warning', feeText(dictionary, 'generate_fee_invalid_file_type', 'Only .xlsx, .xls or .xlsm files are accepted'), 'center')
    }, [dictionary])

    const validateFileType = useCallback((file: File): FileError | null => {
        if (isSupportedFile(file)) return null

        return {
            code: 'file-invalid-type',
            message: feeText(dictionary, 'generate_fee_invalid_file_type', 'Only .xlsx, .xls or .xlsm files are accepted')
        }
    }, [dictionary])

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
        noClick: true
    })

    const handleDownloadTemplate = useCallback(() => {
        setIsDownloadingTemplate(true)

        try {
            downloadGenerateFeeTemplate({
                sheetName: feeText(dictionary, 'generate_fee_template_sheet_name', 'Fee Data'),
                reportTitle: feeText(dictionary, 'generate_fee_template_report_title', 'GENERATE FEE DATA TEMPLATE'),
                reportMeta: feeText(dictionary, 'generate_fee_template_report_meta', ''),
                headers: [
                    feeText(dictionary, 'generate_fee_preview_customer_name', 'Customer Name'),
                    feeText(dictionary, 'generate_fee_preview_apartment_code', 'Customer Code'),
                    feeText(dictionary, 'generate_fee_preview_posting_date', 'Posting Date'),
                    feeText(dictionary, 'generate_fee_preview_document_date', 'Document Date'),
                    feeText(dictionary, 'generate_fee_preview_bill_number', 'Bill Number'),
                    feeText(dictionary, 'generate_fee_preview_invoice_date', 'Invoice Date'),
                    feeText(dictionary, 'generate_fee_preview_invoice_number', 'Invoice Number'),
                    feeText(dictionary, 'generate_fee_preview_description', 'Description'),
                    feeText(dictionary, 'generate_fee_preview_opening_remaining_amount', 'Opening Remaining Amount'),
                    feeText(dictionary, 'generate_fee_preview_total_amount', 'Total Amount'),
                    feeText(dictionary, 'generate_fee_preview_collected_amount', 'Collected Amount'),
                    feeText(dictionary, 'generate_fee_preview_debit_amount', 'Remaining Amount')
                ],
                fileName: feeText(dictionary, 'generate_fee_download_template_file_name', 'generate-fee-template.xlsx')
            })
        } finally {
            setIsDownloadingTemplate(false)
        }
    }, [dictionary])

    const runApartmentCodeCheck = useCallback(async (summary: GenerateFeeValidationSummary): Promise<GenerateFeeValidationSummary> => {
        if (!workingProject) return summary

        const apartmentCodes = summary.rows
            .map(row => row.apartment_code)
            .filter((code): code is string => Boolean(code))

        if (apartmentCodes.length === 0) return summary

        const invalidCodes = await generateFeeService.findInvalidApartmentCodes({
            sessiontoken,
            language: locale,
            projectId: workingProject.id,
            apartmentCodes
        })

        markApartmentCodeErrors(
            summary.rows,
            invalidCodes,
            feeText(dictionary, 'generate_fee_validation_apartment_not_found', 'Apartment code does not exist in the current project.')
        )

        return { ...summary, ...buildGenerateFeeSummaryTotals(summary.rows) }
    }, [dictionary, locale, sessiontoken, workingProject])

    const runFeeTypeLookup = useCallback(async (summary: GenerateFeeValidationSummary): Promise<GenerateFeeValidationSummary> => {
        const feeTypeCodes = summary.rows
            .map(row => row.fee_type_code)
            .filter((code): code is string => Boolean(code))

        if (feeTypeCodes.length === 0) return summary

        const { found, notFound } = await generateFeeService.findFeeTypeNames({
            sessiontoken,
            language: locale,
            codes: feeTypeCodes
        })

        applyFeeTypeLookupResults(
            summary.rows,
            found,
            notFound,
            code => feeText(dictionary, 'generate_fee_fee_type_not_found', 'No matching fee type found for code {code}.').replace('{code}', code)
        )

        return { ...summary, ...buildGenerateFeeSummaryTotals(summary.rows) }
    }, [dictionary, locale, sessiontoken])

    /**
     * File-mode validation is backend-driven (mirrors the resident import flow): the file is sent
     * to /api/fees/import-validate and the returned rows/errors are the source of truth for
     * row validity — client-side apartment/fee-type re-checks are not run on top of it. A
     * best-effort client-side read still supplies the report title/period lines and the raw sheet
     * view for display; if that read fails, validation still proceeds using the backend result.
     */
    const runFileValidation = useCallback(async (file: File, project: { id: number; code: string }): Promise<GenerateFeeValidationSummary> => {
        let displaySummary: GenerateFeeValidationSummary | null = null

        try {
            displaySummary = await parseGenerateFeeWorkbookFile(
                file,
                validationFieldMessages,
                feeText(dictionary, 'generate_fee_sheet_not_found', 'No data found in the Excel file.'),
                feeText(dictionary, 'generate_fee_no_rows_found', 'No data rows found starting from row 4.'),
                locale
            )
        } catch {
            // Display-only metadata (title/period lines, sheet view) is best-effort — a read
            // hiccup here must not block the authoritative backend validation below.
        }

        const backendPayload = await generateFeeService.validateGenerateFeeFile(file, {
            sessiontoken,
            language: locale,
            projectId: project.id,
            projectCode: project.code,
            requestFailedMessage: feeText(dictionary, 'generate_fee_backend_validate_failed', 'Unable to validate the fee import file.')
        })

        applyExecutionId((backendPayload as any)?.execution_id ?? (backendPayload as any)?.data?.execution_id)

        const backendSummary = mapGenerateFeeBackendValidationResponse(
            backendPayload,
            file.name,
            feeText(dictionary, 'generate_fee_row_orphan', 'No matching validation result was found for this row.')
        )

        return {
            ...backendSummary,
            report_info: displaySummary?.report_info ?? null,
            column_headers: displaySummary?.column_headers ?? null,
            sheet_preview: displaySummary?.sheet_preview ?? null
        }
    }, [applyExecutionId, dictionary, locale, sessiontoken, validationFieldMessages])

    const handleValidateData = useCallback(async () => {
        setTitleTouched(true)

        if (!title.trim()) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_title_required', 'Please enter the fee notice title.'), 'center')

            return
        }

        if (!workingProject) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_project_required', 'Please select a working project to continue.'), 'center')

            return
        }

        if (hasProjectContextMismatch) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_project_context_mismatch', 'The project in the URL does not match the active project. Please select the correct project before continuing.'), 'center')

            return
        }

        if (importSourceMode === 'file' && !selectedFile) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_select_file_required', 'Please select an Excel file first.'), 'center')

            return
        }

        if (importSourceMode === 'clipboard' && !clipboardText.trim()) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_clipboard_empty', 'Please paste data before reading.'), 'center')

            return
        }

        setValidationSummary(null)
        setSubmitError(null)
        setPreviewPageIndex(1)
        setIsValidating(true)

        try {
            if (importSourceMode === 'file') {
                const summary = await runFileValidation(selectedFile as File, workingProject)

                setValidationSummary(summary)
            } else {
                let summary = parseGenerateFeeClipboardText(clipboardText, clipboardMessages, locale)

                summary = await runApartmentCodeCheck(summary)
                summary = await runFeeTypeLookup(summary)
                setValidationSummary(summary)
            }
        } catch (error: any) {
            if (error instanceof GenerateFeeFileValidationError) {
                applyExecutionId(error.executionId)
                setSubmitError({ message: error.message, executionId: error.executionId ?? undefined })
                SwalAlert('error', { message: error.message, execution_id: error.executionId ?? undefined }, 'center')
            } else {
                const fallback = importSourceMode === 'file'
                    ? feeText(dictionary, 'generate_fee_backend_validate_failed', 'Unable to validate the fee import file.')
                    : feeText(dictionary, 'generate_fee_clipboard_parse_failed', 'Unable to read the pasted data.')

                SwalAlert('error', String(error?.message ?? fallback), 'center')
            }
        } finally {
            setIsValidating(false)
        }
    }, [applyExecutionId, clipboardMessages, clipboardText, dictionary, hasProjectContextMismatch, importSourceMode, locale, runApartmentCodeCheck, runFeeTypeLookup, runFileValidation, selectedFile, title, workingProject])

    const handleClearData = useCallback(() => {
        setSelectedFile(null)
        setClipboardText('')
        setValidationSummary(null)
        setSubmitError(null)
        setViewMode('preview')
        setPreviewPageIndex(1)
        setExecutionId('')
    }, [])

    const returnProjectId = Number.isInteger(requestedProjectId) && requestedProjectId > 0
        ? requestedProjectId
        : workingProject?.id ?? null
    const feeManagementPath = `/${locale}/fee-management${returnProjectId ? `?project_id=${encodeURIComponent(String(returnProjectId))}` : ''}`

    const handleCancel = useCallback(() => {
        if (!validationSummary) {
            router.push(feeManagementPath)

            return
        }

        SwalAlert(
            'warning',
            feeText(dictionary, 'generate_fee_back_confirm_message', 'If you go back, all validated data will be discarded. Are you sure you want to go back?'),
            'center',
            false,
            true,
            true,
            () => router.push(feeManagementPath),
            commonText(dictionary, 'confirm', 'Confirm')
        )
    }, [dictionary, feeManagementPath, router, validationSummary])

    // Colors picked directly against the requested rules (green when created/updated > 0, orange for
    // skipped, red/green for error rows) — kept local since they only apply to this one summary table.
    const RESULT_COLOR_GREEN = '#16a34a'
    const RESULT_COLOR_ORANGE = '#ea580c'
    const RESULT_COLOR_RED = '#dc2626'
    const RESULT_COLOR_NEUTRAL = '#111827'

    const buildImportResultHtml = useCallback((result: GenerateFeeSubmitResult, fallbackTotal: number) => {
        // Only a row whose count the backend actually returned is shown — "Total submitted" is the
        // one exception, falling back to the submitted item count when the backend omits total_count.
        const total = result.total_count ?? fallbackTotal

        const rows: Array<{ label: string; value: number; color: string }> = [
            { label: feeText(dictionary, 'generate_fee_result_total', 'Total submitted'), value: total, color: RESULT_COLOR_NEUTRAL }
        ]

        if (result.created_count !== null) {
            rows.push({
                label: feeText(dictionary, 'generate_fee_result_created', 'Created'),
                value: result.created_count,
                color: result.created_count > 0 ? RESULT_COLOR_GREEN : RESULT_COLOR_NEUTRAL
            })
        }

        if (result.updated_count !== null) {
            rows.push({
                label: feeText(dictionary, 'generate_fee_result_updated', 'Updated'),
                value: result.updated_count,
                color: result.updated_count > 0 ? RESULT_COLOR_GREEN : RESULT_COLOR_NEUTRAL
            })
        }

        if (result.skipped_count !== null) {
            rows.push({
                label: feeText(dictionary, 'generate_fee_result_skipped', 'Skipped'),
                value: result.skipped_count,
                color: RESULT_COLOR_ORANGE
            })
        }

        if (result.error_count !== null) {
            rows.push({
                label: feeText(dictionary, 'generate_fee_result_errors', 'Error rows'),
                value: result.error_count,
                color: result.error_count > 0 ? RESULT_COLOR_RED : RESULT_COLOR_GREEN
            })
        }

        const rowsHtml = rows.map((row, index) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 6px;${index < rows.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.08);' : ''}">
                <span style="text-align:left;color:#374151;font-size:14px;">${row.label}</span>
                <strong style="text-align:right;font-size:15px;color:${row.color};">${row.value}</strong>
            </div>
        `).join('')

        return `<div style="text-align:left;">${rowsHtml}</div>`
    }, [dictionary])

    const handleImport = useCallback(() => {
        if (isImporting) return

        setTitleTouched(true)

        if (!title.trim()) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_title_required', 'Please enter the fee notice title.'), 'center')

            return
        }

        if (!workingProject) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_project_required', 'Please select a working project to continue.'), 'center')

            return
        }

        if (hasProjectContextMismatch) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_project_context_mismatch', 'The project in the URL does not match the active project. Please select the correct project before continuing.'), 'center')

            return
        }

        if (!validationSummary) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_validate_data', 'Validate Data'), 'center')

            return
        }

        if (validationSummary.error_rows > 0) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_has_error_rows', 'Please resolve all error rows before generating fees.'), 'center')

            return
        }

        if (validationSummary.rows.length === 0) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_no_valid_rows', 'No valid rows to generate fees.'), 'center')

            return
        }

        // Never send INVALID or ORPHAN rows — only VALID/WARNING rows count as "valid_items".
        // ORPHAN = a detail row the backend returned with no matching validation entry, so it was
        // never actually confirmed and must not be silently submitted. Prefer the backend's own raw
        // detail item (preserves every field it returned, not just the ones re-mapped into
        // GenerateFeeImportRow); the pasted-table path has no raw item per row, so it falls back to
        // the mapped GenerateFeeRequestItem.
        const isSubmittableRow = (row: (typeof validationSummary.rows)[number]) => row.status === 'VALID' || row.status === 'WARNING'
        const rawItems = validationSummary.raw_items
        const items = rawItems && rawItems.length === validationSummary.rows.length
            ? validationSummary.rows
                .map((row, index) => ({ row, raw: rawItems[index] }))
                .filter(({ row }) => isSubmittableRow(row))
                .map(({ raw }) => raw)
            : validationSummary.rows
                .filter(isSubmittableRow)
                .map(buildGenerateFeeRequestItem)

        if (items.length === 0) {
            SwalAlert('warning', feeText(dictionary, 'generate_fee_no_valid_rows', 'No valid rows to generate fees.'), 'center')

            return
        }

        const executeImport = async () => {
            setIsImporting(true)
            setSubmitError(null)

            try {
                const result = await generateFeeService.submitGenerateFee(
                    {
                        project_id: workingProject.id,
                        file_name: selectedFile?.name ?? '',
                        // Per explicit confirmation: the existing "Fee Notice Title" input's value is
                        // what gets sent as `notes` — no separate Notes field was added.
                        notes: title.trim(),
                        duplicate_policy: GENERATE_FEE_DUPLICATE_POLICY,
                        items
                    },
                    {
                        sessiontoken,
                        language: locale,
                        projectCode: workingProject.code,
                        requestFailedMessage: feeText(dictionary, 'generate_fee_submit_failed', 'Unable to generate fees.')
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
                        // Only once the user has acknowledged the result — a failed import (see
                        // catch below) must keep the file/validation result in place instead.
                        setTitle('')
                        setTitleTouched(false)
                        resetImportData()
                    },
                    feeText(dictionary, 'generate_fee_result_close', 'Close'),
                    {
                        title: feeText(dictionary, 'generate_fee_result_title', 'Fee generation completed successfully'),
                        html: buildImportResultHtml(result, items.length),
                        width: 520
                    }
                )
            } catch (error: unknown) {
                if (error instanceof GenerateFeeSubmitError) {
                    applyExecutionId(error.execution_id)
                    setSubmitError({ message: error.message, executionId: error.execution_id ?? undefined })
                } else {
                    setSubmitError({ message: String((error as any)?.message ?? '') })
                }

                SwalAlert('error', error, 'center')

                // Keep the selected file and validation result so the user can retry without re-uploading.
            } finally {
                setIsImporting(false)
            }
        }

        const confirmHtml = `
            <div style="text-align:left; font-size:14px; line-height:1.9;">
                <div>${feeText(dictionary, 'generate_fee_confirm_project_label', 'You are about to generate fees for project')}: <strong>${escapeHtml(workingProject.name)}</strong></div>
                <div>${feeText(dictionary, 'generate_fee_confirm_valid_rows_label', 'Valid rows to be submitted')}: <strong>${items.length}</strong></div>
                <div style="margin-top:10px;">${feeText(dictionary, 'generate_fee_confirm_question', 'Are you sure you want to continue?')}</div>
            </div>
        `

        SwalAlert(
            'question',
            '',
            'center',
            false,
            true,
            true,
            () => {
                void executeImport()
            },
            commonText(dictionary, 'confirm', 'Confirm'),
            { html: confirmHtml }
        )
    }, [applyExecutionId, buildImportResultHtml, dictionary, hasProjectContextMismatch, isImporting, locale, resetImportData, selectedFile, sessiontoken, title, validationSummary, workingProject])

    const totalRows = validationSummary?.rows.length ?? 0
    // Invalid rows surface first so the person reviewing the import sees what needs fixing
    // immediately, without having to page through hundreds of valid rows. The sort is stable, so
    // rows within the same status keep their original (Excel/backend) order.
    const sortedRows = useMemo(() => {
        if (!validationSummary) return []

        const statusRank: Record<string, number> = { INVALID: 0, ORPHAN: 1, WARNING: 2, VALID: 3 }

        return [...validationSummary.rows].sort((a, b) => (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3))
    }, [validationSummary])
    const pagedRows = useMemo(() => {
        const start = (previewPageIndex - 1) * previewPageSize

        return sortedRows.slice(start, start + previewPageSize)
    }, [previewPageIndex, previewPageSize, sortedRows])

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
            SwalAlert('success', feeText(dictionary, 'generate_fee_execution_id_copy_success', 'Copied execution ID.'), 'top-end')

            if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
            copiedTimeoutRef.current = setTimeout(() => setExecutionIdCopied(false), 1500)
        } catch {
            SwalAlert('error', feeText(dictionary, 'generate_fee_execution_id_copy_failed', 'Unable to copy execution ID.'), 'top-end')
        }
    }, [dictionary, executionId])

    const hasValidated = Boolean(validationSummary)
    const canValidate = importSourceMode === 'file'
        ? Boolean(selectedFile && !isValidating)
        : Boolean(clipboardText.trim() && !isValidating)
    const canSubmit = Boolean(
        title.trim()
        && workingProject
        && validationSummary
        && !isValidating
        && !isImporting
        && validationSummary.rows.length > 0
        && validationSummary.error_rows === 0
    )
    const canClearData = Boolean(selectedFile || clipboardText || validationSummary)

    return (
        <ContentWrapper
            title={feeText(dictionary, 'generate_fee_page_title', 'Generate Fee')}
            description={feeText(dictionary, 'generate_fee_page_subtitle', 'Import data from an Excel file to bulk-generate fees for the current project.')}
            icon={<PostAddIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                <Stack spacing={3} sx={{ my: 5 }}>
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <TextField
                            value={title}
                            onChange={event => setTitle(event.target.value)}
                            onBlur={() => setTitleTouched(true)}
                            label={feeText(dictionary, 'generate_fee_title_label', 'Fee Notice Title')}
                            placeholder={feeText(dictionary, 'generate_fee_title_placeholder', 'Enter the fee notice title')}
                            required
                            fullWidth
                            error={titleTouched && !title.trim()}
                            helperText={titleTouched && !title.trim() ? feeText(dictionary, 'generate_fee_title_required', 'Please enter the fee notice title.') : ' '}
                        />
                    </Paper>

                    <GenerateFeeSourcePanel
                        dictionary={dictionary}
                        importSourceMode={importSourceMode}
                        onModeChange={handleModeChange}
                        selectedFile={selectedFile}
                        onRemoveFile={() => {
                            setSelectedFile(null)
                            setValidationSummary(null)
                            setSubmitError(null)
                        }}
                        clipboardText={clipboardText}
                        onClipboardTextChange={value => {
                            setClipboardText(value)
                            setValidationSummary(null)
                        }}
                        onClearClipboardText={() => {
                            setClipboardText('')
                            setValidationSummary(null)
                        }}
                        isDownloadingTemplate={isDownloadingTemplate}
                        onDownloadTemplate={handleDownloadTemplate}
                        getRootProps={getRootProps}
                        getInputProps={getInputProps}
                        isDragActive={isDragActive}
                        openFileDialog={open}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={isValidating ? <CircularProgress size={16} color="inherit" /> : <FactCheckIcon />}
                            onClick={() => void handleValidateData()}
                            disabled={!canValidate}
                        >
                            {isValidating
                                ? feeText(dictionary, 'generate_fee_validating', 'Validating...')
                                : hasValidated
                                    ? feeText(dictionary, 'generate_fee_validated', 'Validated')
                                    : feeText(dictionary, 'generate_fee_validate_data', 'Validate Data')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={!canSubmit}
                            startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                            {isImporting
                                ? feeText(dictionary, 'generate_fee_processing', 'Generating fees...')
                                : feeText(dictionary, 'generate_fee_submit', 'Generate Fee')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleClearData}
                            disabled={!canClearData}
                        >
                            {feeText(dictionary, 'generate_fee_clear_data', 'Clear Data')}
                        </Button>
                        <Button variant="text" color="secondary" startIcon={<ArrowBackIcon />} onClick={handleCancel}>
                            {feeText(dictionary, 'generate_fee_cancel', 'Cancel')}
                        </Button>
                    </Stack>

                    {submitError && (
                        <WorkflowErrorAlert
                            title={feeText(dictionary, 'generate_fee_submit', 'Generate Fee')}
                            message={submitError.message}
                            executionId={submitError.executionId}
                            executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
                            copyLabel={commonText(dictionary, 'copy', 'Copy')}
                            copiedLabel={locale === 'vi' ? 'Đã sao chép' : 'Copied'}
                            copySuccessMessage={dictionary.common?.copiedErrorReference ?? (locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference')}
                            copyFailedMessage={locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.'}
                        />
                    )}

                    {/* submitError already shows its own execution id + copy button (WorkflowErrorAlert
                        above) — this standalone block only covers the remaining case: a successful
                        validate/import, where no error alert is on screen. */}
                    {executionId && !submitError && (
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
                                {feeText(dictionary, 'generate_fee_execution_id_label', 'Execution ID')}:
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
                        <>
                            <GenerateFeeSummaryPanel
                                dictionary={dictionary}
                                summary={validationSummary}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />

                            <Box>
                                {viewMode === 'sheet' && validationSummary.sheet_preview ? (
                                    <GenerateFeeSheetViewer sheetPreview={validationSummary.sheet_preview} />
                                ) : (
                                    <GenerateFeePreviewTable
                                        dictionary={dictionary}
                                        locale={locale}
                                        rows={pagedRows}
                                        totalRows={totalRows}
                                        pageIndex={previewPageIndex}
                                        pageSize={previewPageSize}
                                        columnHeaders={validationSummary.column_headers}
                                        onPageChange={handlePreviewPageChange}
                                        onPageSizeChange={handlePreviewPageSizeChange}
                                        onJumpPage={handlePreviewJumpPage}
                                    />
                                )}
                            </Box>
                        </>
                    )}
                </Stack>
            </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default GenerateFeeImportPage
