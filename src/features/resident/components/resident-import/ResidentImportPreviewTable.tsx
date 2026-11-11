'use client'

import { useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import {
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import ApartmentSearchSelect from '@/shared/components/apartment-lookup/ApartmentSearchSelect'

import { ResidentImportValidationRow } from '../../types'
import { type ResidentImportRowField, VALID_RELATIONSHIP_TYPES } from '../../utils/residentImport'
import { localizedCatalogLabel, ResidentDictionary, text } from '../../utils/residentLabels'

export type ResidentImportEditableValues = Record<ResidentImportRowField, string | null>

// Table scrolls horizontally (14 columns), so the Actions column is pinned to the right edge —
// solid background so scrolled-past cells never show through, plus a soft left shadow to mark
// the boundary. zIndex 2 keeps it above regular body cells while staying below the sticky header.
const stickyActionBodyCellSx = {
    position: 'sticky',
    right: 0,
    zIndex: 2,
    bgcolor: 'background.paper',
    boxShadow: '-4px 0 6px -4px rgba(0, 0, 0, 0.35)'
} as const

// Same pin, but on top of the sticky header (stickyHeader already gives top:0 / zIndex:2 — this
// cell needs to win over both the other header cells during horizontal scroll and the sticky body
// cells during vertical scroll, hence the higher zIndex).
const stickyActionHeaderCellSx = {
    position: 'sticky',
    right: 0,
    zIndex: 3,
    boxShadow: '-4px 0 6px -4px rgba(0, 0, 0, 0.35)'
} as const

type ResidentImportPreviewTableProps = {
    dict: ResidentDictionary
    rows: ResidentImportValidationRow[]
    canEdit: boolean
    savingRowNumber: number | null
    onSaveRow: (rowNumber: number, values: ResidentImportEditableValues) => Promise<boolean>
    /** Needed to search apartments (WF_BO_LIST_APARTMENTS_BY_PROJECT) scoped to the current project. */
    sessiontoken?: string
    language?: Locale | string
    projectId?: number | null
}

const EDITABLE_FIELDS: ResidentImportRowField[] = [
    'full_name',
    'phone_number',
    'email',
    'identity_no',
    'date_of_birth',
    'gender',
    'apartment_code',
    'relationship_type',
    'is_owner',
    'move_in_date',
    'note'
]

const toEditableValues = (row: ResidentImportValidationRow): ResidentImportEditableValues => (
    EDITABLE_FIELDS.reduce((acc, field) => {
        acc[field] = row[field]

        return acc
    }, {} as ResidentImportEditableValues)
)

export default function ResidentImportPreviewTable({
    dict,
    rows,
    canEdit,
    savingRowNumber,
    onSaveRow,
    sessiontoken,
    language,
    projectId
}: ResidentImportPreviewTableProps) {
    const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null)
    const [draft, setDraft] = useState<ResidentImportEditableValues | null>(null)

    const apartmentSelectMessages = {
        placeholder: text(dict, 'import_apartment_search_placeholder', 'Search apartment code...'),
        loadingText: text(dict, 'import_apartment_loading', 'Searching apartments...'),
        emptyText: text(dict, 'import_apartment_empty', 'No matching apartment found.'),
        loadErrorText: text(dict, 'import_apartment_load_error', 'Unable to load apartments.'),
        retryLabel: text(dict, 'import_apartment_retry', 'Retry'),
        loadingMoreText: text(dict, 'import_apartment_loading_more', 'Loading more...')
    }

    const previewColumns = [
        text(dict, 'import_preview_row_number', 'Row'),
        text(dict, 'import_preview_status', 'Status'),
        text(dict, 'import_preview_full_name', 'Full Name'),
        text(dict, 'import_preview_phone_number', 'Phone Number'),
        text(dict, 'import_preview_email', 'Email'),
        text(dict, 'import_preview_identity_no', 'Identity No'),
        text(dict, 'import_preview_date_of_birth', 'Date of Birth'),
        text(dict, 'import_preview_gender', 'Gender'),
        text(dict, 'import_preview_apartment_code', 'Apartment'),
        text(dict, 'import_preview_relationship_type', 'Resident role'),
        text(dict, 'import_preview_is_owner', 'Owner'),
        text(dict, 'import_preview_move_in_date', 'Move-in Date'),
        text(dict, 'import_preview_note', 'Note'),
        text(dict, 'import_preview_errors', 'Errors')
    ]
    const actionsColumnLabel = text(dict, 'import_preview_actions', 'Actions')

    const genderOptions = [
        { value: 'MALE', label: text(dict, 'option_gender_m', 'Male') },
        { value: 'FEMALE', label: text(dict, 'option_gender_f', 'Female') },
        { value: 'OTHER', label: text(dict, 'option_gender_o', 'Other') }
    ]

    const relationshipOptions = Array.from(VALID_RELATIONSHIP_TYPES)
        .filter(value => value !== 'FAMILY_MEMBER')
        .map(value => ({ value, label: localizedCatalogLabel(dict, value, value) || value }))

    const ownerOptions = [
        { value: 'Y', label: text(dict, 'import_is_owner_yes', 'Yes') },
        { value: 'N', label: text(dict, 'import_is_owner_no', 'No') }
    ]

    const startEdit = (row: ResidentImportValidationRow) => {
        setEditingRowNumber(row.row_number)
        setDraft(toEditableValues(row))
    }

    const cancelEdit = () => {
        setEditingRowNumber(null)
        setDraft(null)
    }

    const updateDraft = (field: ResidentImportRowField, value: string) => {
        setDraft(prev => (prev ? { ...prev, [field]: value === '' ? null : value } : prev))
    }

    const handleSaveClick = async (rowNumber: number) => {
        if (!draft) return

        const ok = await onSaveRow(rowNumber, draft)

        if (ok) {
            setEditingRowNumber(null)
            setDraft(null)
        }
    }

    const renderTextCell = (
        row: ResidentImportValidationRow,
        field: ResidentImportRowField,
        isEditing: boolean,
        options?: { type?: string; multiline?: boolean }
    ) => {
        if (isEditing && draft) {
            return (
                <TextField
                    value={draft[field] ?? ''}
                    onChange={event => updateDraft(field, event.target.value)}
                    type={options?.type ?? 'text'}
                    multiline={options?.multiline}
                    size="small"
                    fullWidth
                    sx={{ minWidth: 140 }}
                />
            )
        }

        return row[field] || '-'
    }

    const renderSelectCell = (
        field: ResidentImportRowField,
        isEditing: boolean,
        options: { value: string; label: string }[],
        displayValue: string
    ) => {
        if (isEditing && draft) {
            return (
                <TextField
                    select
                    value={draft[field] ?? ''}
                    onChange={event => updateDraft(field, event.target.value)}
                    size="small"
                    fullWidth
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">-</MenuItem>
                    {options.map(option => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>
            )
        }

        return displayValue || '-'
    }

    const renderApartmentCell = (row: ResidentImportValidationRow, isEditing: boolean) => {
        if (isEditing && draft) {
            return (
                <ApartmentSearchSelect
                    sessiontoken={sessiontoken}
                    language={language}
                    projectId={projectId}
                    value={draft.apartment_code}
                    // The row is only ever editable while it still has a validation error, so the
                    // raw apartment_code carried over from Excel is treated as unconfirmed until the
                    // user actually picks a real apartment from the search results.
                    unconfirmed
                    onChange={code => updateDraft('apartment_code', code)}
                    messages={apartmentSelectMessages}
                />
            )
        }

        return row.apartment_code || '-'
    }

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1800 }}>
                <TableHead>
                    <TableRow>
                        {previewColumns.map(label => (
                            <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                {label}
                            </TableCell>
                        ))}
                        <TableCell
                            data-tour="resident-import-edit-action"
                            sx={{
                                ...stickyActionHeaderCellSx,
                                bgcolor: 'primary.main',
                                color: 'common.white',
                                fontWeight: 800,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {actionsColumnLabel}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={previewColumns.length + 1} align="center" sx={{ py: 6 }}>
                                {text(dict, 'import_preview_empty', 'No validation rows found.')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map(row => {
                            const isEditing = canEdit && editingRowNumber === row.row_number
                            const isSaving = savingRowNumber === row.row_number

                            return (
                                <TableRow
                                    key={`${row.row_number}-${row.identity_no ?? row.email ?? row.phone_number ?? 'row'}`}
                                    hover
                                    selected={isEditing}
                                >
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.row_number || '-'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        <Chip
                                            size="small"
                                            color={row.status === 'VALID' ? 'success' : 'error'}
                                            label={row.status === 'VALID'
                                                ? text(dict, 'import_status_valid', 'Valid')
                                                : text(dict, 'import_status_invalid', 'Invalid')}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>{renderTextCell(row, 'full_name', isEditing)}</TableCell>
                                    <TableCell sx={{ minWidth: 140 }}>{renderTextCell(row, 'phone_number', isEditing)}</TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>{renderTextCell(row, 'email', isEditing)}</TableCell>
                                    <TableCell sx={{ minWidth: 140 }}>{renderTextCell(row, 'identity_no', isEditing)}</TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>{renderTextCell(row, 'date_of_birth', isEditing, { type: 'date' })}</TableCell>
                                    <TableCell sx={{ minWidth: 140 }}>
                                        {renderSelectCell(
                                            'gender',
                                            isEditing,
                                            genderOptions,
                                            localizedCatalogLabel(dict, row.gender || undefined, row.gender || undefined) || row.gender || ''
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 200 }}>{renderApartmentCell(row, isEditing)}</TableCell>
                                    <TableCell sx={{ minWidth: 170 }}>
                                        {renderSelectCell(
                                            'relationship_type',
                                            isEditing,
                                            relationshipOptions,
                                            localizedCatalogLabel(dict, row.relationship_type || undefined, row.relationship_type || undefined) || row.relationship_type || ''
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 110 }}>
                                        {renderSelectCell(
                                            'is_owner',
                                            isEditing,
                                            ownerOptions,
                                            row.is_owner === 'Y'
                                                ? text(dict, 'import_is_owner_yes', 'Yes')
                                                : row.is_owner === 'N'
                                                    ? text(dict, 'import_is_owner_no', 'No')
                                                    : row.is_owner || ''
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 150 }}>{renderTextCell(row, 'move_in_date', isEditing, { type: 'date' })}</TableCell>
                                    <TableCell sx={{ minWidth: 200 }}>{renderTextCell(row, 'note', isEditing, { multiline: true })}</TableCell>
                                    <TableCell sx={{ minWidth: 240 }}>
                                        {row.errors.length === 0 ? (
                                            '-'
                                        ) : (
                                            <Stack spacing={0.5}>
                                                {row.errors.map((error, index) => (
                                                    <Typography key={`${row.row_number}-error-${index}`} variant="body2" color="error.main">
                                                        {error}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ ...stickyActionBodyCellSx, whiteSpace: 'nowrap' }}>
                                        {/* A row is editable purely based on whether it actually carries validation
                                            errors — the authoritative, already-displayed signal from the backend —
                                            never the free-form `status` string, whose exact wording isn't guaranteed. */}
                                        {!canEdit || row.errors.length === 0 ? null : isEditing ? (
                                            <Stack direction="row" spacing={0.5}>
                                                <Tooltip title={text(dict, 'import_action_save', 'Save')}>
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            disabled={isSaving}
                                                            onClick={() => void handleSaveClick(row.row_number)}
                                                        >
                                                            {isSaving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={text(dict, 'import_action_cancel', 'Cancel')}>
                                                    <span>
                                                        <IconButton size="small" disabled={isSaving} onClick={cancelEdit}>
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Stack>
                                        ) : (
                                            <Tooltip title={text(dict, 'import_action_edit', 'Edit')}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => startEdit(row)}
                                                        disabled={editingRowNumber !== null}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
