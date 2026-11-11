import {
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

import type { ReportDictionary, ReportItem } from '../types'
import { commonText, reportText } from './reportHelpers'

type Props = {
  dictionary: ReportDictionary
  rows: ReportItem[]
  loading: boolean
  pageIndex: number
  pageSize: number
  onOpenDetail: (row: ReportItem) => void
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

const columns = ['no', 'reportcode', 'reportname', 'reportdescription'] as const

const ReportTable = ({ dictionary, rows, loading, pageIndex, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<ReportItem>({
    rowInteraction: { onOpenDetail }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column} sx={headerCellSx}>
                  {column === 'no'
                    ? commonText(dictionary, 'nodot', 'No.')
                    : reportText(dictionary, column, column)}
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
                    {reportText(dictionary, 'report_empty_title', 'No matching reports found.')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${row.code}-${row.id ?? index}`}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={nowrapCellSx}>{pageIndex * pageSize + index + 1}</TableCell>
                  <TableCell sx={nowrapCellSx}>{row.code || '-'}</TableCell>
                  <TableCell sx={textCellSx}>
                    <Typography sx={{ fontWeight: 800 }}>{row.name || '-'}</Typography>
                  </TableCell>
                  <TableCell sx={textCellSx}>{row.description || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default ReportTable
