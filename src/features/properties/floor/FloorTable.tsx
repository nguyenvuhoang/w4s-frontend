import { Chip, CircularProgress, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material'

import { formatPropertyCount, formatPropertyText } from '@/features/properties/propertyFieldHelpers'

import { useSearchTableRowConfig } from '@/shared/components/table'

import {
  commonText,
  displayValue,
  floorText,
  getFloorStatusColor,
  getFloorStatusLabel
} from './floorHelpers'
import type { FloorDictionary, FloorSearchItem } from './types'

type Props = {
  dictionary: FloorDictionary
  /** Number formatting of the resident count (defaults to vi). */
  locale?: string
  rows: FloorSearchItem[]
  loading?: boolean
  navigatingId?: number | null
  onRowDoubleClick?: (row: FloorSearchItem) => void
}

const FloorTable = ({
  dictionary,
  locale = 'vi',
  rows,
  loading = false,
  navigatingId = null,
  onRowDoubleClick
}: Props) => {
  const columns = [
    { label: floorText(dictionary, 'floorCode', 'Floor Code') },
    { label: floorText(dictionary, 'floorName', 'Floor Name') },
    { label: commonText(dictionary, 'description', 'Description') },
    { label: floorText(dictionary, 'residentCount', 'Resident count'), align: 'right' as const },
    { label: floorText(dictionary, 'status', 'Status') }
  ]
  const table = useSearchTableRowConfig<FloorSearchItem>({
    rowInteraction: {
      onOpenDetail: onRowDoubleClick,
      isRowInteractive: () => Boolean(onRowDoubleClick)
    }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.label} align={column.align} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton height={34} />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  {floorText(dictionary, 'emptyFloors', 'No floors found.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const isNavigating = navigatingId === row.id

                return (
                  <TableRow
                    key={row.id || `${row.building_id}-${row.floor_code}`}
                    {...table.getRowProps(row)}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{displayValue(row.floor_code)}</span>
                        {isNavigating && <CircularProgress size={14} thickness={5} />}
                      </Stack>
                    </TableCell>
                    <TableCell>{displayValue(row.name)}</TableCell>
                    {/* Long descriptions stay on one line (ellipsis) with the full text in a tooltip. */}
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Tooltip title={row.description?.trim() ?? ''} placement="top-start">
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formatPropertyText(row.description)}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatPropertyCount(row.resident_count, locale)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={getFloorStatusColor(row.status)}
                        label={getFloorStatusLabel(dictionary, row.status)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default FloorTable
