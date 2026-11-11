import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import {
    Chip,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { useMemo } from 'react'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { FacilitiesDictionary, FacilityCategoryItem, FacilityItem } from '../../types'
import {
    commonText,
    facilitiesText,
    formatFacilityMoney,
    formatNullableNumber,
    getFacilityStatusColor,
    getFacilityStatusLabel
} from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    locale: string
    rows: FacilityItem[]
    category_options: FacilityCategoryItem[]
    loading: boolean
    page_index: number
    page_size: number
    on_row_open: (row: FacilityItem) => void
}

const header_cell_sx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const text_cell_sx = {
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
    lineHeight: 1.45
}

const nowrap_cell_sx = {
    whiteSpace: 'nowrap'
}

const columns = [
    'no',
    'facility_name',
    'category',
    'description',
    'require_deposit',
    'deposit_amount',
    'max_slots_per_day',
    'advance_booking_days',
    'display_order',
    'status'
] as const

const FacilitiesTable = ({ dictionary, locale, rows, category_options, loading, page_index, page_size, on_row_open }: Props) => {
    const category_lookups = useMemo(() => {
        const name_by_id = new Map<number, string>()
        const name_by_code = new Map<string, string>()

        category_options.forEach(category => {
            const category_id = Number(category.id ?? category.facility_category_id)
            const category_code = String(category.category_code ?? '').trim()

            if (Number.isFinite(category_id) && category_id > 0 && category.name) {
                name_by_id.set(category_id, category.name)
            }

            if (category_code && category.name) {
                name_by_code.set(category_code, category.name)
            }
        })

        return { name_by_id, name_by_code }
    }, [category_options])

    const table = useSearchTableRowConfig<FacilityItem>({
        rowInteraction: { onOpenDetail: on_row_open }
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1080 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={header_cell_sx}>
                                    {column === 'no'
                                        ? commonText(dictionary, 'nodot', 'No.')
                                        : facilitiesText(dictionary, `field_${column}`, column)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: page_size }).map((_, row_index) => (
                                <TableRow key={row_index}>
                                    {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {facilitiesText(dictionary, 'empty_title', 'No matching facilities found.')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow
                                    key={`${row.project_id}-${row.facility_code}-${index}`}
                                    {...table.getRowProps(row)}
                                >
                                    <TableCell sx={nowrap_cell_sx}>{(page_index - 1) * page_size + index + 1}</TableCell>
                                    <TableCell sx={text_cell_sx}>
                                        <Typography sx={{ fontWeight: 800 }}>{row.name || '-'}</Typography>
                                    </TableCell>
                                    <TableCell sx={text_cell_sx}>
                                        {row.facility_category_name
                                            || category_lookups.name_by_id.get(Number(row.facility_category_id))
                                            || category_lookups.name_by_code.get(String(row.facility_category_code ?? '').trim())
                                            || '-'}
                                    </TableCell>
                                    <TableCell sx={text_cell_sx}>{row.description || '-'}</TableCell>
                                    <TableCell sx={nowrap_cell_sx} align="center">
                                        {row.require_deposit ? (
                                            <CheckCircleIcon color="success" fontSize="small" />
                                        ) : (
                                            <CloseIcon color="error" fontSize="small" />
                                        )}
                                    </TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatFacilityMoney(row.deposit_amount, locale)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableNumber(row.max_slots_per_day)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableNumber(row.advance_booking_days)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableNumber(row.display_order)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>
                                        <Chip
                                            size="small"
                                            color={getFacilityStatusColor(row.status)}
                                            label={getFacilityStatusLabel(dictionary, row.status)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default FacilitiesTable
