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

import type { VendorItem, VendorsDictionary } from '../vendorTypes'
import {
    commonText,
    displayVendorValue,
    getVendorStatusColor,
    getVendorStatusLabel,
    vendorsText
} from './vendorHelpers'

type Props = {
    dictionary: VendorsDictionary
    rows: VendorItem[]
    loading: boolean
    pageIndex: number
    pageSize: number
    onView: (id: number) => void
}

const columns = [
    'no',
    'vendor_code',
    'vendor_name',
    'tax_code',
    'contact_person',
    'phone',
    'email',
    'address',
    'status'
] as const

const headerCellSx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const VendorsTable = ({ dictionary, rows, loading, pageIndex, pageSize, onView }: Props) => {
    const handleOpenDetail = (row: VendorItem) => {
        if (row.id > 0) onView(row.id)
    }

    const table = useSearchTableRowConfig<VendorItem>({
        rowInteraction: {
            onOpenDetail: handleOpenDetail,
            isRowInteractive: row => row.id > 0
        }
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={headerCellSx}>
                                    {column === 'no'
                                        ? commonText(dictionary, 'nodot', 'No.')
                                        : vendorsText(dictionary, column, column)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 7 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {vendorsText(dictionary, 'no_vendors_found', 'No vendors found')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {vendorsText(dictionary, 'empty_description', 'Try changing the search keyword or project filter.')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow
                                key={row.id || `${row.vendor_code}-${index}`}
                                {...table.getRowProps(row)}
                            >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{displayVendorValue(row.vendor_code)}</TableCell>
                                <TableCell sx={{ minWidth: 220 }}>{displayVendorValue(row.name)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayVendorValue(row.tax_code)}</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>{displayVendorValue(row.contact_person)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayVendorValue(row.phone)}</TableCell>
                                <TableCell sx={{ minWidth: 180 }}>{displayVendorValue(row.email)}</TableCell>
                                <TableCell sx={{ minWidth: 240 }}>{displayVendorValue(row.address)}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={getVendorStatusColor(row.status)}
                                        label={getVendorStatusLabel(dictionary, row.status)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default VendorsTable
