import BlockIcon from '@mui/icons-material/Block'
import CategoryIcon from '@mui/icons-material/Category'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
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

import type { FacilitiesDictionary, FacilityCategoryItem } from '../../types'
import {
    commonText,
    facilitiesText,
    formatNullableNumber,
    getFacilityStatusColor,
    getFacilityStatusLabel
} from './facilityListHelpers'

type Props = {
    dictionary: FacilitiesDictionary
    rows: FacilityCategoryItem[]
    loading: boolean
    page_index: number
    page_size: number
    on_view: (row: FacilityCategoryItem) => void
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
    'category_code',
    'category_name',
    'icon',
    'display_order',
    'status'
] as const

const FacilityCategoriesTable = ({ dictionary, rows, loading, page_index, page_size, on_view }: Props) => {
    const getRowActions = (): RowActionConfig<FacilityCategoryItem>[] => {
        const notAvailableReason = () => facilitiesText(dictionary, 'action_not_available', 'Workflow is not configured yet')

        return [
            {
                key: 'view',
                label: commonText(dictionary, 'view', 'View'),
                icon: <VisibilityIcon fontSize="small" />,
                onClick: on_view
            },
            {
                key: 'edit',
                label: commonText(dictionary, 'edit', 'Edit'),
                icon: <EditIcon fontSize="small" />,
                disabledWhen: () => true,
                disabledReason: notAvailableReason,
                onClick: () => {}
            },
            {
                key: 'deactivate',
                label: facilitiesText(dictionary, 'deactivate', 'Deactivate'),
                icon: <BlockIcon fontSize="small" />,
                disabledWhen: () => true,
                disabledReason: notAvailableReason,
                onClick: () => {}
            }
        ]
    }

    const table = useSearchTableRowConfig<FacilityCategoryItem>({
        dictionary,
        rowInteraction: { onOpenDetail: on_view },
        rowActions: getRowActions,
        rows
    })

    return (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <TableContainer>
                <Table stickyHeader size="small" sx={{ minWidth: 860 }}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column} sx={header_cell_sx}>
                                    {column === 'no'
                                        ? commonText(dictionary, 'nodot', 'No.')
                                        : facilitiesText(dictionary, `field_${column}`, column)}
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
                                        {facilitiesText(dictionary, 'categories_empty_title', 'No matching facility categories found.')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow
                                    key={`${row.project_id}-${row.category_code}-${index}`}
                                    {...table.getRowProps(row)}
                                >
                                    <TableCell sx={nowrap_cell_sx}>{(page_index - 1) * page_size + index + 1}</TableCell>
                                    <TableCell sx={{ ...text_cell_sx, fontWeight: 800 }}>{row.category_code || '-'}</TableCell>
                                    <TableCell sx={text_cell_sx}>{row.name || '-'}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>
                                        {row.icon_url ? (
                                            <Avatar src={row.icon_url} variant="rounded" sx={{ width: 32, height: 32 }}>
                                                <CategoryIcon fontSize="small" />
                                            </Avatar>
                                        ) : (
                                            <Typography color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={nowrap_cell_sx}>{formatNullableNumber(row.display_order)}</TableCell>
                                    <TableCell sx={nowrap_cell_sx}>
                                        <Chip
                                            size="small"
                                            color={getFacilityStatusColor(row.status)}
                                            label={getFacilityStatusLabel(dictionary, row.status)}
                                        />
                                    </TableCell>
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

export default FacilityCategoriesTable
