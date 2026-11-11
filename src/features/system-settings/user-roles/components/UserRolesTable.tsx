import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'
import type { RowActionConfig } from '@/shared/components/table'

import type { UserRoleItem, UserRolesDictionary } from '../types'
import {
  displayValue,
  formatUserRoleDateTime,
  getUserRoleShowLabel,
  getUserRoleStatusColor,
  getUserRoleStatusLabel,
  userRoleText
} from './userRoleHelpers'

type Props = {
  dictionary: UserRolesDictionary
  rows: UserRoleItem[]
  loading: boolean
  pageIndex: number
  pageSize: number
  onOpenDetail: (row: UserRoleItem) => void
  /** Omit to keep the table with no "..." action column, matching all other unmigrated tables. */
  rowActions?: (row: UserRoleItem) => RowActionConfig<UserRoleItem>[]
}

const dataColumns = [
  'role_name',
  'role_description',
  'user_type',
  'role_type',
  'service_id',
  'status',
  'is_show',
  'date_created'
] as const

type DataColumn = typeof dataColumns[number]

const columnWidths: Record<DataColumn, number> = {
  role_name: 200,
  role_description: 300,
  user_type: 120,
  role_type: 200,
  service_id: 100,
  status: 140,
  is_show: 100,
  date_created: 170
}

const ACTIONS_COLUMN_WIDTH = 64

const tableMinWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)

const compactCellSx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

const truncateTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block'
}

const chipSx = {
  minWidth: 84,
  justifyContent: 'center'
}

const getColumnLabel = (dictionary: UserRolesDictionary, column: DataColumn) => {
  const labels: Record<DataColumn, string> = {
    role_name: userRoleText(dictionary, 'field_role_name', 'Role Name'),
    role_description: userRoleText(dictionary, 'field_role_description', 'Description'),
    user_type: userRoleText(dictionary, 'field_user_type', 'User Type'),
    role_type: userRoleText(dictionary, 'field_role_type', 'Role Type'),
    service_id: userRoleText(dictionary, 'field_service_id', 'Service'),
    status: userRoleText(dictionary, 'field_status', 'Status'),
    is_show: userRoleText(dictionary, 'field_is_show', 'Visible'),
    date_created: userRoleText(dictionary, 'field_date_created', 'Created Date')
  }

  return labels[column]
}

const getRowKey = (row: UserRoleItem, index: number) => (
  row.role_id ? `role-${row.role_id}` : `role-row-${row.id || index}`
)

const TruncatedCell = ({ value, fontWeight }: { value: string, fontWeight?: number }) => (
  <Tooltip title={value === '-' ? '' : value}>
    <Typography component="span" sx={{ ...truncateTextSx, fontWeight, fontSize: 'inherit' }}>
      {value}
    </Typography>
  </Tooltip>
)

const UserRolesTable = ({ dictionary, rows, loading, pageSize, onOpenDetail, rowActions }: Props) => {
  const table = useSearchTableRowConfig<UserRoleItem>({
    dictionary,
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => row.role_id > 0
    },
    rowActions,
    rows,
    actionsColumnWidth: ACTIONS_COLUMN_WIDTH
  })

  const columnCount = dataColumns.length + (table.hasActionsColumn ? 1 : 0)
  const minWidth = tableMinWidth + (table.hasActionsColumn ? table.actionsColumnWidth : 0)

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth }}>
        <colgroup>
          {dataColumns.map(column => <col key={column} style={{ width: columnWidths[column] }} />)}
          {table.renderActionsCol()}
        </colgroup>
        <TableHead>
          <TableRow>
            {dataColumns.map(column => (
              <TableCell
                key={column}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}
              >
                {getColumnLabel(dictionary, column)}
              </TableCell>
            ))}
            {table.renderActionsHeaderCell()}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }).map((__, cellIndex) => <TableCell key={cellIndex}><Skeleton height={28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {userRoleText(dictionary, 'empty_title', 'No matching user roles found.')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : rows.map((row, index) => (
            <TableRow
              key={getRowKey(row, index)}
              {...table.getRowProps(row)}
            >
              <TableCell sx={{ fontWeight: 800 }}>
                <TruncatedCell value={displayValue(row.role_name)} fontWeight={800} />
              </TableCell>
              <TableCell>
                <TruncatedCell value={displayValue(row.role_description)} />
              </TableCell>
              <TableCell sx={compactCellSx}>{displayValue(row.user_type)}</TableCell>
              <TableCell>
                <TruncatedCell value={displayValue(row.role_type)} />
              </TableCell>
              <TableCell sx={compactCellSx}>{displayValue(row.service_id)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex' }}>
                  <Chip
                    size="small"
                    color={getUserRoleStatusColor(row.status)}
                    label={getUserRoleStatusLabel(dictionary, row.status)}
                    sx={chipSx}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex' }}>
                  <Chip
                    size="small"
                    color={row.is_show === 'Y' ? 'success' : 'default'}
                    label={getUserRoleShowLabel(dictionary, row.is_show)}
                    sx={chipSx}
                  />
                </Box>
              </TableCell>
              <TableCell sx={compactCellSx}>{formatUserRoleDateTime(row.date_created)}</TableCell>
              {table.renderActionsCell(row)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default UserRolesTable
