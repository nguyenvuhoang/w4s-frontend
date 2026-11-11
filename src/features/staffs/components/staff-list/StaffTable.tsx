import { memo } from 'react'

import PersonIcon from '@mui/icons-material/Person'
import {
    Avatar,
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

import type { StaffDictionary, StaffModel } from '../../types'
import {
    formatStaffDateTime,
    getBooleanLabel,
    getStaffFullName,
    getStaffLoginLabel,
    getStaffStatusColor,
    getStaffStatusLabel,
    staffText
} from './staffListHelpers'

type Props = {
    dictionary: StaffDictionary
    rows: StaffModel[]
    loading: boolean
    page_size: number
    text_namespace?: 'staffs' | 'residents_tenants'
    selected_id?: number
    on_select: (row: StaffModel) => void
    on_view_detail: (row: StaffModel) => void
    /** Omit to keep the table with no "..." action column, matching all other unmigrated tables. */
    row_actions?: (row: StaffModel) => RowActionConfig<StaffModel>[]
}

const ACTIONS_COLUMN_WIDTH = 56

const staff_column_widths = ['7%', '12%', '12%', '21%', '10%', '12%', '8%', '9%', '9%']
const resident_tenant_column_widths = ['7%', '13%', '13%', '24%', '11%', '13%', '8%', '11%']

const text_cell_sx = {
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
    lineHeight: 1.45
}

const compact_cell_sx = {
    whiteSpace: 'nowrap'
}

const getStaffRowKey = (row: StaffModel, index: number) => {
    const stable_key = row.user_code || row.user_id || row.login_name || row.user_name || String(row.id || '')

    return stable_key ? `${stable_key}-${index}` : `staff-row-${index}`
}

const StaffTable = memo(({ dictionary, rows, loading, page_size, text_namespace = 'staffs', selected_id, on_select, on_view_detail, row_actions }: Props) => {
    const show_super_admin = text_namespace !== 'residents_tenants'
    const column_widths = show_super_admin ? staff_column_widths : resident_tenant_column_widths

    const table = useSearchTableRowConfig<StaffModel>({
        dictionary,
        rowInteraction: {
            onOpenDetail: on_view_detail
        },
        rowActions: row_actions,
        rows,
        actionsColumnWidth: ACTIONS_COLUMN_WIDTH
    })

    const column_count = column_widths.length + (table.hasActionsColumn ? 1 : 0)

    const headers = [
        staffText(dictionary, 'field_avatar', 'Avatar', text_namespace),
        staffText(dictionary, 'field_login_name', 'Username/Login name', text_namespace),
        staffText(dictionary, 'field_full_name', 'Full name', text_namespace),
        staffText(dictionary, 'field_email', 'Email', text_namespace),
        staffText(dictionary, 'field_phone', 'Phone', text_namespace),
        staffText(dictionary, 'field_status', 'Status', text_namespace),
        staffText(dictionary, 'field_is_login', 'Is login', text_namespace),
        ...(show_super_admin ? [staffText(dictionary, 'field_super_admin', 'Super admin', text_namespace)] : []),
        staffText(dictionary, 'field_last_login_time', 'Last login time', text_namespace)
    ]

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        {column_widths.map((width, index) => <col key={index} style={{ width }} />)}
                        {table.renderActionsCol()}
                    </colgroup>
                    <TableHead>
                        <TableRow>
                            {headers.map((label, index) => (
                                <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, ...(index === 3 ? text_cell_sx : {}) }}>
                                    {label}
                                </TableCell>
                            ))}
                            {table.renderActionsHeaderCell()}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: page_size }).map((_, index) => (
                                <TableRow key={index}>
                                    {Array.from({ length: column_count }).map((__, cell_index) => <TableCell key={cell_index}><Skeleton height={28} /></TableCell>)}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={column_count} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {staffText(dictionary, 'empty_title', 'No matching staffs found.', text_namespace)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => {
                                const row_props = table.getRowProps(row)

                                return (
                                <TableRow
                                    key={getStaffRowKey(row, index)}
                                    selected={row.id === selected_id}
                                    {...row_props}
                                    onClick={event => {
                                        on_select(row)
                                        row_props.onClick?.(event)
                                    }}
                                >
                                    <TableCell>
                                        <Avatar src={row.avatar ?? undefined} sx={{ width: 34, height: 34 }}>
                                            {!row.avatar && <PersonIcon fontSize="small" />}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell sx={{ ...text_cell_sx, fontWeight: 800 }}>{row.login_name || row.user_name || '-'}</TableCell>
                                    <TableCell sx={text_cell_sx}>{getStaffFullName(row)}</TableCell>
                                    <TableCell sx={text_cell_sx}>{row.email || '-'}</TableCell>
                                    <TableCell sx={compact_cell_sx}>{row.phone || '-'}</TableCell>
                                    <TableCell sx={compact_cell_sx}><Chip size="small" color={getStaffStatusColor(row.status)} label={getStaffStatusLabel(dictionary, row.status, text_namespace)} /></TableCell>
                                    <TableCell sx={compact_cell_sx}><Chip size="small" color={row.is_login ? 'success' : 'default'} label={getStaffLoginLabel(dictionary, row.is_login, text_namespace)} /></TableCell>
                                    {show_super_admin && (
                                        <TableCell sx={compact_cell_sx}><Chip size="small" color={row.is_super_admin ? 'info' : 'default'} label={getBooleanLabel(dictionary, row.is_super_admin)} /></TableCell>
                                    )}
                                    <TableCell sx={compact_cell_sx}>{formatStaffDateTime(row.last_login_time)}</TableCell>
                                    {table.renderActionsCell(row)}
                                </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
})

StaffTable.displayName = 'StaffTable'

export default StaffTable
