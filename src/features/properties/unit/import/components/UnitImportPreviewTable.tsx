'use client'

import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { ChangeEvent } from 'react'

import PaginationPage from '@/@core/components/jTable/pagination'

import { apartmentText } from '../../apartmentHelpers'
import type { ApartmentDictionary } from '../../types'
import type { ApartmentImportDisplayRow } from '../types'
import { isApartmentImportRowValid } from '../utils/unitImportBackendMapper'

type Props = {
  dictionary: ApartmentDictionary
  rows: ApartmentImportDisplayRow[]
  totalRows: number
  pageIndex: number
  pageSize: number
  onPageChange: (event: ChangeEvent<unknown>, page: number) => void
  onPageSizeChange: (event: SelectChangeEvent<number>) => void
  onJumpPage: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Pinned-column widths/offsets — see the file-level comment below for why these three (and only
// these three) are frozen during horizontal scroll.
const COL_ROW_WIDTH = 72
const COL_STATUS_WIDTH = 140
const COL_APARTMENT_CODE_WIDTH = 170

const displayValue = (value: string | number | null | undefined) => (
  value === null || value === undefined || value === '' ? '-' : String(value)
)

/**
 * "Dòng", "Kết quả kiểm tra" and "Mã căn hộ đầy đủ" are pinned via `position: sticky` so they stay
 * visible for cross-checking while the operator scrolls through the remaining columns — a common
 * "frozen columns" pattern (not full DataGrid virtualization): the 3 pinned columns aren't adjacent
 * in the requested column order, but sticky columns only need to share contiguous *left offsets*
 * against each other, not against the normal-scrolling columns sitting between them in the DOM —
 * those simply scroll underneath once the pinned columns reach their stuck position. Known
 * trade-off: row hover shading does not visually extend across the pinned cells.
 */
const UnitImportPreviewTable = ({
  dictionary,
  rows,
  totalRows,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onJumpPage
}: Props) => {
  const t = (key: string, fallback: string) => apartmentText(dictionary, key, fallback)

  const columns = [
    { label: t('importApartmentColRow', 'Row'), pin: 'row' as const },
    { label: t('importApartmentColStatus', 'Validation Result'), pin: 'status' as const },
    { label: t('importApartmentColBuildingCode', 'Building Code'), pin: null },
    { label: t('importApartmentColFloorCode', 'Floor Code'), pin: null },
    { label: t('importApartmentColUnitNumber', 'Unit Code'), pin: null },
    { label: t('importApartmentColFullUnitCode', 'Full Unit Code'), pin: 'apartmentCode' as const },
    { label: t('importApartmentColUnitType', 'Unit Type'), pin: null },
    { label: t('importApartmentColUnitStatus', 'Apartment Status'), pin: null },
    { label: t('importApartmentColSize', 'Area'), pin: null },
    { label: t('importApartmentColNumOfRoom', 'Num of room'), pin: null },
    { label: t('importApartmentColElectricMeterCode', 'Electric Meter'), pin: null },
    { label: t('importApartmentColWaCode1', 'Water Meter 1'), pin: null },
    { label: t('importApartmentColWaCode2', 'Water Meter 2'), pin: null },
    { label: t('importApartmentColDescription', 'Description'), pin: null },
    { label: t('importApartmentColErrors', 'Errors'), pin: null }
  ]

  const pinSx = (pin: 'row' | 'status' | 'apartmentCode' | null, isHeader: boolean) => {
    if (!pin) return {}

    const left = pin === 'row' ? 0 : pin === 'status' ? COL_ROW_WIDTH : COL_ROW_WIDTH + COL_STATUS_WIDTH
    const width = pin === 'row' ? COL_ROW_WIDTH : pin === 'status' ? COL_STATUS_WIDTH : COL_APARTMENT_CODE_WIDTH

    return {
      position: 'sticky' as const,
      left,
      minWidth: width,
      maxWidth: width,
      zIndex: isHeader ? 4 : 2,
      bgcolor: isHeader ? 'primary.main' : 'background.paper'
    }
  }

  return (
    <Stack spacing={2}>
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1900 }}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={`${index}-${column.label}`}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    ...pinSx(column.pin, true)
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  {t('importApartmentPreviewEmpty', 'No validation rows found.')}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const valid = isApartmentImportRowValid(row)

                return (
                  <TableRow key={`${index}-${row.rowNumber}`} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', ...pinSx('row', false) }}>{row.rowNumber}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', ...pinSx('status', false) }}>
                      <Chip
                        size="small"
                        color={valid ? 'success' : 'error'}
                        label={valid
                          ? t('importApartmentStatusValid', 'Valid')
                          : t('importApartmentStatusInvalid', 'Invalid')}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.buildingCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.floorCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.unitNumber)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', ...pinSx('apartmentCode', false) }}>{displayValue(row.apartmentCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.apartmentType)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.apartmentStatus)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.area)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.roomCount)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.electricMeterCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.waterMeterCode)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayValue(row.waterMeterCode2)}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>{displayValue(row.description)}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      {row.errors.length === 0 ? '-' : (
                        <Stack spacing={0.5}>
                          {row.errors.map((error, errorIndex) => (
                            <Typography key={`${row.rowNumber}-error-${errorIndex}`} variant="body2" color="error.main">
                              {error}
                            </Typography>
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalRows > 0 && (
        <PaginationPage
          page={pageIndex}
          pageSize={pageSize}
          totalResults={totalRows}
          jumpPage={pageIndex}
          handlePageSizeChange={onPageSizeChange}
          handlePageChange={onPageChange}
          handleJumpPage={onJumpPage}
          dictionary={dictionary}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}
    </Stack>
  )
}

export default UnitImportPreviewTable
