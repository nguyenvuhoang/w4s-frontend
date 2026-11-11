'use client'

import {
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { ChangeEvent } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'
import { formatFeeDetailDate, formatFeeDetailMoney } from '../../components/feeDetailHelpers'
import { feeText } from '../../components/feeTypeHelpers'
import type { FeeDictionary } from '../../types'
import type { GenerateFeeImportRow, GenerateFeeRowStatus } from '../types'

type Props = {
    dictionary: FeeDictionary
    locale: string
    rows: GenerateFeeImportRow[]
    totalRows: number
    pageIndex: number
    pageSize: number
    /** Row 3 header labels read directly from the Excel file, used as-is when available. */
    columnHeaders?: string[] | null
    onPageChange: (event: ChangeEvent<unknown>, page: number) => void
    onPageSizeChange: (event: SelectChangeEvent<number>) => void
    onJumpPage: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const getStatusColor = (status: GenerateFeeRowStatus) => {
    if (status === 'VALID') return 'success'
    if (status === 'WARNING') return 'warning'
    if (status === 'ORPHAN') return 'default'

    return 'error'
}

/**
 * Never renders `errors.length`/`warnings.length` directly and never falls back to `?? 0` — an
 * empty, null, or missing array must show as blank, not as the literal number 0. Handles the
 * backend sending `errors: []`, `errors: null`, or the field being absent entirely.
 */
const renderRowIssues = (row: GenerateFeeImportRow) => {
    const errors = Array.isArray(row.errors) ? row.errors : []
    const warnings = Array.isArray(row.warnings) ? row.warnings : []

    if (errors.length === 0 && warnings.length === 0) return null

    return (
        <Stack spacing={0.5}>
            {errors.map((error, index) => (
                <Typography key={`err-${row.row_number}-${index}`} variant="body2" color="error.main">
                    {error}
                </Typography>
            ))}
            {warnings.map((warning, index) => (
                <Typography key={`warn-${row.row_number}-${index}`} variant="body2" color="warning.main">
                    {warning}
                </Typography>
            ))}
        </Stack>
    )
}

const GenerateFeePreviewTable = ({
    dictionary,
    locale,
    rows,
    totalRows,
    pageIndex,
    pageSize,
    columnHeaders,
    onPageChange,
    onPageSizeChange,
    onJumpPage
}: Props) => {
    const getStatusLabel = (status: GenerateFeeRowStatus) => {
        if (status === 'VALID') return feeText(dictionary, 'generate_fee_status_valid', 'Valid')
        if (status === 'WARNING') return feeText(dictionary, 'generate_fee_status_warning', 'Warning')
        if (status === 'ORPHAN') return feeText(dictionary, 'generate_fee_status_orphan', 'Orphan')

        return feeText(dictionary, 'generate_fee_status_invalid', 'Invalid')
    }

    // The 12 data columns use the file's own row-3 header text when available (file import),
    // falling back to translated defaults for paste-table import (no header row to read).
    const defaultDataColumnLabels = [
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
    ]
    const dataColumnLabels = defaultDataColumnLabels.map((fallback, index) => columnHeaders?.[index]?.trim() || fallback)

    const columns = [
        feeText(dictionary, 'generate_fee_preview_row', 'Row'),
        feeText(dictionary, 'generate_fee_preview_status', 'Status'),
        ...dataColumnLabels,
        feeText(dictionary, 'generate_fee_preview_fee_type', 'Fee Type'),
        feeText(dictionary, 'generate_fee_preview_errors', 'Errors / Warnings')
    ]

    return (
        <Stack spacing={2}>
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 2200 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((label, index) => (
                                <TableCell key={`${index}-${label}`} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    {label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    {feeText(dictionary, 'generate_fee_preview_empty', 'No data rows found.')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                // row_number alone is not guaranteed unique (e.g. two backend rows
                                // can legitimately share a document number) — the page index makes
                                // the key unique regardless of any upstream data duplication.
                                <TableRow key={`${index}-${row.row_number}`} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.row_number}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        <Chip size="small" color={getStatusColor(row.status)} label={getStatusLabel(row.status)} />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>{row.customer_name || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.apartment_code || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFeeDetailDate(row.posting_date)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFeeDetailDate(row.document_date)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.bill_payment_number || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFeeDetailDate(row.invoice_date)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.invoice_number || '-'}</TableCell>
                                    <TableCell sx={{ minWidth: 200 }}>{row.description || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatFeeDetailMoney(row.opening_remaining_amount, locale)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatFeeDetailMoney(row.amount, locale)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatFeeDetailMoney(row.paid_amount, locale)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>{formatFeeDetailMoney(row.remaining_amount, locale)}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {row.fee_type_name || row.fee_type_code || '-'}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 260 }}>
                                        {renderRowIssues(row)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalRows > 0 && (
                <PaginationPage
                    page={pageIndex}
                    pageSize={pageSize}
                    totalResults={totalRows}
                    jumpPage={pageIndex}
                    handlePageSizeChange={onPageSizeChange}
                    handlePageChange={onPageChange}
                    handleJumpPage={onJumpPage}
                    dictionary={dictionary}
                />
            )}
        </Stack>
    )
}

export default GenerateFeePreviewTable
