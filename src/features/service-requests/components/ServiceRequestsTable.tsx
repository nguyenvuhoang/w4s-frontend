import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import BlockIcon from '@mui/icons-material/Block'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'
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

import type { ServiceRequestItem, ServiceRequestsDictionary } from '../types'
import {
    commonText,
    formatServiceRequestDate,
    getPriorityColor,
    getPriorityLabel,
    getRequestStatusColor,
    getRequestStatusLabel,
    getRequestTypeLabel,
    serviceRequestsText
} from './serviceRequestHelpers'

const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'D']

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: string
    rows: ServiceRequestItem[]
    loading: boolean
    pageIndex: number
    pageSize: number
    onViewDetail: (row: ServiceRequestItem) => void
    onUpdateStatus: (row: ServiceRequestItem) => void
    onOpenAssignHandler: (row: ServiceRequestItem) => void
    onCancel: (row: ServiceRequestItem) => void
    onDeactivate: (row: ServiceRequestItem) => void
    mutationLoading: boolean
}

const columns = [
    'no',
    'request_code',
    'request_type',
    'request_title',
    'project_code',
    'apartment_code',
    'category_code',
    'priority',
    'request_status',
    'scheduled_date',
    'completed_on',
    'rating'
] as const

const headerCellSx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const ServiceRequestsTable = ({
    dictionary,
    locale,
    rows,
    loading,
    pageIndex,
    pageSize,
    onViewDetail,
    onUpdateStatus,
    onOpenAssignHandler,
    onCancel,
    onDeactivate,
    mutationLoading
}: Props) => {
    const getRowActions = (row: ServiceRequestItem): RowActionConfig<ServiceRequestItem>[] => {
        const isClosed = CLOSED_STATUSES.includes(row.status)

        return [
            {
                key: 'update_status',
                label: serviceRequestsText(dictionary, 'update_request_status'),
                icon: <PublishedWithChangesIcon fontSize="small" />,
                disabledWhen: () => mutationLoading,
                onClick: onUpdateStatus
            },
            {
                key: 'assign',
                label: serviceRequestsText(dictionary, 'assign_service_request'),
                icon: <AssignmentIndIcon fontSize="small" />,
                disabledWhen: () => mutationLoading || isClosed,
                disabledReason: () => (isClosed ? serviceRequestsText(dictionary, 'assign_request_closed') : undefined),
                onClick: onOpenAssignHandler
            },
            {
                key: 'cancel',
                label: serviceRequestsText(dictionary, 'cancel_service_request'),
                icon: <CancelOutlinedIcon fontSize="small" />,
                disabledWhen: () => mutationLoading,
                onClick: onCancel
            },
            {
                key: 'deactivate',
                label: serviceRequestsText(dictionary, 'deactivate_service_request'),
                icon: <BlockIcon fontSize="small" />,
                color: 'warning',
                disabledWhen: () => mutationLoading,
                onClick: onDeactivate
            }
        ]
    }

    const table = useSearchTableRowConfig<ServiceRequestItem>({
        dictionary,
        rowInteraction: { onOpenDetail: onViewDetail },
        rowActions: getRowActions,
        rows
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 1480 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={headerCellSx}>
                                    {column === 'no' ? commonText(dictionary, 'nodot') : serviceRequestsText(dictionary, column)}
                                </TableCell>
                            ))}
                            {table.renderActionsHeaderCell()}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                                    {table.hasActionsColumn && <TableCell><Skeleton height={28} /></TableCell>}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (table.hasActionsColumn ? 1 : 0)} align="center" sx={{ py: 6 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                        {serviceRequestsText(dictionary, 'no_service_requests_found')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow
                                key={row.id || `${row.request_code}-${index}`}
                                {...table.getRowProps(row)}
                            >
                                <TableCell>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{row.request_code || '-'}</TableCell>
                                <TableCell>{getRequestTypeLabel(dictionary, row.request_type)}</TableCell>
                                <TableCell sx={{ minWidth: 220 }}>{row.title || '-'}</TableCell>
                                <TableCell>{row.project_code || '-'}</TableCell>
                                <TableCell>{row.apartment_code || '-'}</TableCell>
                                <TableCell>{row.category_code || '-'}</TableCell>
                                <TableCell>
                                    <Chip size="small" color={getPriorityColor(row.priority)} label={getPriorityLabel(dictionary, row.priority)} />
                                </TableCell>
                                <TableCell>
                                    <Chip size="small" color={getRequestStatusColor(row.status)} label={getRequestStatusLabel(dictionary, row.status)} />
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatServiceRequestDate(row.scheduled_date, locale)}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatServiceRequestDate(row.completed_on_utc, locale)}</TableCell>
                                <TableCell>{row.rating ?? '-'}</TableCell>
                                {table.renderActionsCell(row)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    )
}

export default ServiceRequestsTable
