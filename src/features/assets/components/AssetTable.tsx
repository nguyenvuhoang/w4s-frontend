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

import type { AssetDictionary, AssetItem } from '../types'
import {
  assetText,
  formatAssetDate,
  formatAssetValue,
  getAssetCategoryLabel,
  getAssetStatusColor,
  getAssetStatusLabel
} from './assetHelpers'

type Props = {
  dictionary: AssetDictionary
  locale: string
  rows: AssetItem[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: AssetItem) => void
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
  'asset_code',
  'name',
  'project_code',
  'category',
  'location',
  'qr_code',
  'purchase_date',
  'purchase_value',
  'status'
] as const

const AssetTable = ({ dictionary, locale, rows, loading, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<AssetItem>({
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => Boolean(row.id)
    }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column} sx={headerCellSx} align={column === 'purchase_value' ? 'right' : 'left'}>
                  {assetText(dictionary, `field_${column}`, column)}
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
                    {assetText(dictionary, 'empty_title', 'No matching assets found.')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${row.project_id}-${row.asset_code}-${row.id ?? index}`}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={nowrapCellSx}>
                    <Typography sx={{ fontWeight: 800 }}>{row.asset_code || '-'}</Typography>
                  </TableCell>
                  <TableCell sx={textCellSx}>{row.name || '-'}</TableCell>
                  <TableCell sx={nowrapCellSx}>{row.project_code || '-'}</TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Chip size="small" variant="outlined" label={getAssetCategoryLabel(dictionary, row.category)} />
                  </TableCell>
                  <TableCell sx={textCellSx}>{row.location || '-'}</TableCell>
                  <TableCell sx={nowrapCellSx}>{row.qr_code || '-'}</TableCell>
                  <TableCell sx={nowrapCellSx}>{formatAssetDate(row.purchase_date)}</TableCell>
                  <TableCell sx={nowrapCellSx} align="right">{formatAssetValue(row.purchase_value, locale)}</TableCell>
                  <TableCell sx={nowrapCellSx}>
                    <Chip
                      size="small"
                      color={getAssetStatusColor(row.status)}
                      label={getAssetStatusLabel(dictionary, row.status)}
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

export default AssetTable
