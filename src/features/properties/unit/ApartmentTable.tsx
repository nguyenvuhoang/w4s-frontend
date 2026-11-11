import {
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'

import { formatPropertyCount, formatPropertyText } from '@/features/properties/propertyFieldHelpers'

import {
  apartmentText,
  displayValue,
  formatApartmentArea,
  getApartmentRecordStatusColor,
  getApartmentRecordStatusLabel,
  resolveBuildingLabel,
  resolveProjectLabel
} from './apartmentHelpers'
import { getApartmentTypeCaption, useApartmentTypeCodeList } from './hooks/useApartmentTypeCodeList'
import type { ApartmentBuildingOption, ApartmentDictionary, ApartmentProjectOption, ApartmentSearchItem } from './types'

type Props = {
  dictionary: ApartmentDictionary
  /** Number formatting (defaults to vi). */
  locale?: string
  rows: ApartmentSearchItem[]
  projectOptions: ApartmentProjectOption[]
  buildingOptions: ApartmentBuildingOption[]
  loading?: boolean
  navigatingId?: number | null
  onRowDoubleClick?: (row: ApartmentSearchItem) => void
}

const ApartmentTable = ({
  dictionary,
  locale = 'vi',
  rows,
  projectOptions,
  buildingOptions,
  loading = false,
  navigatingId = null,
  onRowDoubleClick
}: Props) => {
  const apartmentTypeCodes = useApartmentTypeCodeList(locale)
  // The business apartment status column only appears once the search returns that field (no CodeList yet:
  // the raw value is shown). It is separate from the record status A / I.
  const showApartmentStatus = rows.some(row => Boolean(row.apartment_status?.trim()))
  const columns = [
    { label: apartmentText(dictionary, 'apartmentCode', 'Full apartment code') },
    { label: apartmentText(dictionary, 'apartmentNo', 'Unit Code') },
    { label: apartmentText(dictionary, 'project', 'Project') },
    { label: apartmentText(dictionary, 'building', 'Building') },
    { label: apartmentText(dictionary, 'floor', 'Floor') },
    { label: apartmentText(dictionary, 'apartmentType', 'Apartment Type') },
    { label: apartmentText(dictionary, 'area', 'Area') },
    { label: apartmentText(dictionary, 'roomCount', 'Room count'), align: 'right' as const },
    { label: apartmentText(dictionary, 'waterMeterCode', 'Water Meter') },
    ...(showApartmentStatus ? [{ label: apartmentText(dictionary, 'apartmentStatus', 'Apartment status') }] : []),
    { label: apartmentText(dictionary, 'status', 'Status') }
  ]
  const table = useSearchTableRowConfig<ApartmentSearchItem>({
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
                  <TableCell colSpan={columns.length}><Skeleton height={34} /></TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  {apartmentText(dictionary, 'emptyTitle', 'No data found')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const isNavigating = navigatingId === row.id

                return (
                  <TableRow
                    key={row.id}
                    {...table.getRowProps(row)}
                  >
                    <TableCell sx={{ fontWeight: 800 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{displayValue(row.apartment_code)}</span>
                        {isNavigating && <CircularProgress size={14} thickness={5} />}
                      </Stack>
                    </TableCell>
                    <TableCell>{displayValue(row.unit_number)}</TableCell>
                    <TableCell>{resolveProjectLabel(projectOptions, row.project_id)}</TableCell>
                    <TableCell>{resolveBuildingLabel(buildingOptions, row.building_id)}</TableCell>
                    <TableCell>{row.floor || '-'}</TableCell>
                    <TableCell>{getApartmentTypeCaption(apartmentTypeCodes.captionMap, row.apartment_type) || '-'}</TableCell>
                    <TableCell>{formatApartmentArea(row.area)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatPropertyCount(row.room_count, locale)}</TableCell>
                    <TableCell>{displayValue(row.water_meter_code)}</TableCell>
                    {showApartmentStatus && <TableCell>{formatPropertyText(row.apartment_status)}</TableCell>}
                    <TableCell>
                      <Chip size="small" color={getApartmentRecordStatusColor(row.status)} label={getApartmentRecordStatusLabel(dictionary, row.status)} />
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

export default ApartmentTable
