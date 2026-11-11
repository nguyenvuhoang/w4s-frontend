import { Chip, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@mui/material'

import { formatPropertyCount, formatPropertyText } from '@/features/properties/propertyFieldHelpers'

import { useRowInteraction } from '@/shared/utils/rowInteraction'

import {
  buildingText,
  commonText,
  displayValue,
  formatNumber,
  getBuildingStatusColor,
  getBuildingStatusLabel
} from './buildingHelpers'
import type { BuildingDictionary, BuildingSearchItem } from './types'

type Props = {
  dictionary: BuildingDictionary
  locale: string
  rows: BuildingSearchItem[]
  loading?: boolean
  onOpenDetail?: (row: BuildingSearchItem) => void
}

const BuildingTable = ({
  dictionary,
  locale,
  rows,
  loading = false,
  onOpenDetail
}: Props) => {
  // Single click (or Enter) on a row opens the tower detail; clicks on nested controls are ignored.
  const { getRowProps } = useRowInteraction<BuildingSearchItem>({
    mode: 'single-click',
    onOpenDetail,
    isRowInteractive: row => Boolean(onOpenDetail) && row.id > 0
  })

  const columns = [
    { label: buildingText(dictionary, 'buildingCode', 'Building Code') },
    { label: buildingText(dictionary, 'buildingName', 'Building Name') },
    { label: buildingText(dictionary, 'floorCount', 'Floor Count') },
    { label: commonText(dictionary, 'description', 'Description') },
    { label: buildingText(dictionary, 'residentCount', 'Resident count'), align: 'right' as const },
    { label: buildingText(dictionary, 'status', 'Status') }
  ]

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
                  {buildingText(dictionary, 'emptyBuildings', 'No buildings found.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.id || `${row.project_id}-${row.building_code}`} {...getRowProps(row)}>
                  <TableCell sx={{ fontWeight: 800 }}>{displayValue(row.building_code)}</TableCell>
                  <TableCell>{displayValue(row.name)}</TableCell>
                  <TableCell>{formatNumber(row.floor_count, locale)}</TableCell>
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
                      color={getBuildingStatusColor(row.status)}
                      label={getBuildingStatusLabel(dictionary, row.status)}
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

export default BuildingTable
