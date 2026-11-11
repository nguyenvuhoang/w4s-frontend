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

import type { ContractItem, ContractsDictionary } from '../types'
import {
    commonText,
    contractsText,
    emptyText,
    formatContractDate,
    formatContractValue,
    getContractStatusColor,
    getContractStatusLabel
} from './contractHelpers'

type Props = {
    dictionary: ContractsDictionary
    rows: ContractItem[]
    loading: boolean
    pageIndex: number
    pageSize: number
    onOpenDetail: (row: ContractItem) => void
}

const columns = [
    'no',
    'contract_number',
    'project_code',
    'vendor_code',
    'contract_title',
    'start_date',
    'end_date',
    'contract_value',
    'status'
] as const

const headerCellSx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const ContractsTable = ({
    dictionary,
    rows,
    loading,
    pageIndex,
    pageSize,
    onOpenDetail
}: Props) => {
    const table = useSearchTableRowConfig<ContractItem>({
        rowInteraction: { onOpenDetail }
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1180 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={headerCellSx}>
                                    {column === 'no'
                                        ? commonText(dictionary, 'nodot', 'No.')
                                        : contractsText(dictionary, column, column)}
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
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {contractsText(dictionary, 'no_contracts_found', 'No Contracts Found')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow
                                key={row.id || `${row.contract_number}-${index}`}
                                {...table.getRowProps(row)}
                            >
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{emptyText(row.contract_number)}</TableCell>
                                <TableCell>{emptyText(row.project_code)}</TableCell>
                                <TableCell>{emptyText(row.vendor_code)}</TableCell>
                                <TableCell sx={{ minWidth: 220 }}>{emptyText(row.title)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatContractDate(row.start_date)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatContractDate(row.end_date)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatContractValue(row.contract_value)}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={getContractStatusColor(row.status)}
                                        label={getContractStatusLabel(dictionary, row.status)}
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

export default ContractsTable
