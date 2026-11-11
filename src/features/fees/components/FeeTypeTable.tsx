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

import type { FeeDictionary, FeeTypeItem } from '../types'
import {
  commonText,
  feeText,
  formatFeeAmount,
  getCalculationMethodLabel,
  getFeeTypeStatusColor,
  getFeeTypeStatusLabel
} from './feeTypeHelpers'

type Props = {
  dictionary: FeeDictionary
  locale: string
  rows: FeeTypeItem[]
  loading: boolean
  pageIndex: number
  pageSize: number
  onOpenDetail: (row: FeeTypeItem) => void
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const textCellSx = {
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
  lineHeight: 1.45
}

const nowrapCellSx = {
  whiteSpace: 'nowrap'
}

const columns = [
  'no',
  'fee_type_name',
  'calculation_method',
  'unit',
  'default_amount',
  'status'
] as const

const FeeTypeTable = ({ dictionary, locale, rows, loading, pageIndex, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<FeeTypeItem>({
    rowInteraction: { onOpenDetail }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column} sx={headerCellSx} align={column === 'default_amount' ? 'right' : 'left'}>
                  {column === 'no'
                    ? commonText(dictionary, 'nodot', 'No.')
                    : feeText(dictionary, `field_${column}`, column)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {feeText(dictionary, 'fee_type_empty_title', 'No matching fee types found.')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${row.fee_type_code}-${row.id ?? index}`}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={nowrapCellSx}>{(pageIndex - 1) * pageSize + index + 1}</TableCell>
                  <TableCell sx={textCellSx}>
                    <Typography sx={{ fontWeight: 800 }}>{row.name || '-'}</Typography>
                  </TableCell>
                  <TableCell sx={nowrapCellSx}>{getCalculationMethodLabel(dictionary, row.calculation_method)}</TableCell>
                  <TableCell sx={nowrapCellSx}>{row.unit || '-'}</TableCell>
                  <TableCell sx={nowrapCellSx} align="right">{formatFeeAmount(row.default_amount, locale)}</TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Chip
                      size="small"
                      color={getFeeTypeStatusColor(row.status)}
                      label={getFeeTypeStatusLabel(dictionary, row.status)}
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

export default FeeTypeTable
