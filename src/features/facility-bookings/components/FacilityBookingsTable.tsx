import BlockIcon from '@mui/icons-material/Block'
import VisibilityIcon from '@mui/icons-material/Visibility'
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

import { useSearchTableRowConfig } from '@/shared/components/table'
import type { RowActionConfig } from '@/shared/components/table'
import { usePermission } from '@shared/permissions/usePermission'

import type { FacilityBookingItem, FacilityBookingsDictionary } from '../types'
import {
    bookingText,
    commonText,
    formatBookingDate,
    formatBookingMoney,
    formatNullableText,
    formatTimeSlot,
    getBookingStatusColor,
    getBookingStatusLabel
} from './facilityBookingHelpers'

type Props = {
    dictionary: FacilityBookingsDictionary
    locale: string
    rows: FacilityBookingItem[]
    loading: boolean
    page_index: number
    page_size: number
    on_view: (row: FacilityBookingItem) => void
    on_deactivate: (row: FacilityBookingItem) => void
    deactivate_loading: boolean
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
    'booking_code',
    'project_code',
    'facility_code',
    'apartment_code',
    'booking_date',
    'time_slot',
    'service_fee',
    'deposit_amount',
    'total_amount',
    'status',
    'note'
] as const

const FacilityBookingsTable = ({
    dictionary,
    locale,
    rows,
    loading,
    page_index,
    page_size,
    on_view,
    on_deactivate,
    deactivate_loading
}: Props) => {
    const modify_permission = usePermission({ href: '/facilities/bookings' })
    const can_modify = modify_permission.resolved && modify_permission.can('MODIFY')

    const getRowActions = (): RowActionConfig<FacilityBookingItem>[] => [
        {
            key: 'view',
            label: commonText(dictionary, 'view'),
            icon: <VisibilityIcon fontSize="small" />,
            onClick: on_view
        },
        {
            key: 'deactivate',
            label: bookingText(dictionary, 'deactivate_facility_booking'),
            icon: <BlockIcon fontSize="small" />,
            color: 'warning',
            permission: can_modify,
            disabledWhen: () => deactivate_loading,
            onClick: on_deactivate
        }
    ]

    // Row interaction here stays exactly as before (plain `hover`, no click-to-detail) — this
    // table only ever opened detail via the "..." menu, so the shared row-interaction config is
    // deliberately not applied to the row itself, only the actions column below.
    const table = useSearchTableRowConfig<FacilityBookingItem>({
        dictionary,
        rowActions: getRowActions,
        rows
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1320 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={header_cell_sx}>
                                    {column === 'no'
                                        ? commonText(dictionary, 'nodot', 'No.')
                                        : bookingText(dictionary, `field_${column}`, column)}
                                </TableCell>
                            ))}
                            {table.renderActionsHeaderCell()}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: page_size }).map((_, row_index) => (
                                <TableRow key={row_index}>
                                    {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                                    {table.hasActionsColumn && <TableCell><Skeleton height={28} /></TableCell>}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (table.hasActionsColumn ? 1 : 0)} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {bookingText(dictionary, 'empty_title', 'No matching facility bookings found.')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow key={`${row.id}-${row.booking_code}-${index}`} hover>
                                    <TableCell sx={nowrap_cell_sx}>{(page_index - 1) * page_size + index + 1}</TableCell>
                                    <TableCell sx={{ ...text_cell_sx, fontWeight: 800 }}>{formatNullableText(row.booking_code)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableText(row.project_code)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableText(row.facility_code)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableText(row.apartment_code)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatBookingDate(row.booking_date, locale)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatTimeSlot(row.start_time, row.end_time)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatBookingMoney(row.service_fee, locale)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatBookingMoney(row.deposit_amount, locale)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatBookingMoney(row.total_amount, locale)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>
                                        <Chip
                                            size="small"
                                            color={getBookingStatusColor(row.status)}
                                            label={getBookingStatusLabel(dictionary, row.status)}
                                        />
                                    </TableCell>
                                    <TableCell sx={text_cell_sx}>{formatNullableText(row.note)}</TableCell>
                                    {table.renderActionsCell(row)}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default FacilityBookingsTable
