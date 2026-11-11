import { Chip, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'

import { displayPartnerText, getPartnerStatusColor, getPartnerStatusLabel, partnerText } from '../partnerHelpers'
import type { PartnerDictionary, PartnerItem } from '../types'

type Props = {
  dictionary: PartnerDictionary
  rows: PartnerItem[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: PartnerItem) => void
}

const columns = ['partner_code', 'partner_name', 'contact_name', 'phone', 'email', 'address', 'status'] as const
const headerCellSx = { bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }
const textCellSx = { overflowWrap: 'anywhere', whiteSpace: 'normal', lineHeight: 1.45, maxWidth: 280 }

const PartnerTable = ({ dictionary, rows, loading, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<PartnerItem>({
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => row.id !== null
    }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer>
      <Table stickyHeader size="small" sx={{ minWidth: 1050 }}>
        <TableHead>
          <TableRow>
            {columns.map(column => <TableCell key={column} sx={headerCellSx}>{partnerText(dictionary, `field_${column}`, column)}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: pageSize }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>{columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}</TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{partnerText(dictionary, 'empty_title', 'No matching partners found.')}</Typography></TableCell></TableRow>
          ) : rows.map((row, index) => (
            <TableRow
              key={`${row.partner_code}-${row.id ?? index}`}
              {...table.getRowProps(row)}
            >
              <TableCell sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 700 }}>{displayPartnerText(row.partner_code)}</TableCell>
              <TableCell sx={textCellSx}>{displayPartnerText(row.partner_name)}</TableCell>
              <TableCell sx={textCellSx}>{displayPartnerText(row.contact_name)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayPartnerText(row.phone)}</TableCell>
              <TableCell sx={textCellSx}>{displayPartnerText(row.email)}</TableCell>
              <TableCell sx={textCellSx}>{displayPartnerText(row.address)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip size="small" color={getPartnerStatusColor(row.status)} label={getPartnerStatusLabel(dictionary, row.status)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default PartnerTable
