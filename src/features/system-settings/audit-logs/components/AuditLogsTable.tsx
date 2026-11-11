import {
  Link as MuiLink,
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
import Link from 'next/link'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { AuditLogItem, AuditLogsDictionary } from '../types'
import {
  auditLogDictText,
  formatAuditLogDateTime,
  formatAuditLogDuration,
  getAuditLogStatusMeta,
  toAuditLogDetailPath
} from './auditLogHelpers'

type Props = {
  locale: string
  dictionary: AuditLogsDictionary
  rows: AuditLogItem[]
  loading: boolean
  pageSize: number
  onView: (row: AuditLogItem) => void
}

const columns = [
  'execution_id',
  'workflow_id',
  'status',
  'created_on',
  'finish_on',
  'duration',
  'error'
] as const

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const AuditLogsTable = ({ locale, dictionary, rows, loading, pageSize, onView }: Props) => {
  const table = useSearchTableRowConfig<AuditLogItem>({
    rowInteraction: {
      onOpenDetail: onView,
      isRowInteractive: row => Boolean(row.execution_id)
    }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer>
      <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_execution_id', 'Execution ID')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_workflow_id', 'Workflow ID')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_status', 'Status')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_created_on', 'Created On')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_finish_on', 'Finish On')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_duration', 'Duration')}</TableCell>
            <TableCell sx={headerCellSx}>{auditLogDictText(dictionary, 'field_error', 'Error')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {auditLogDictText(dictionary, 'empty_title', 'No audit logs found')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : rows.map((row, index) => {
            const statusMeta = getAuditLogStatusMeta(row.status, locale)
            const errorText = row.error || '-'

            return (
              <TableRow
                key={row.execution_id || `${row.workflow_id}-${index}`}
                {...table.getRowProps(row)}
              >
                <TableCell sx={{ minWidth: 260, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {row.execution_id ? (
                    <MuiLink
                      component={Link}
                      href={toAuditLogDetailPath(locale, row.execution_id)}
                      underline="hover"
                      sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                    >
                      {row.execution_id}
                    </MuiLink>
                  ) : '-'}
                </TableCell>
                <TableCell sx={{ minWidth: 180, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {row.workflow_id || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={statusMeta.color}
                    variant={statusMeta.variant}
                    label={statusMeta.label}
                  />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogDateTime(row.created_on, locale)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogDateTime(row.finish_on, locale)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogDuration(row.created_on, row.finish_on)}</TableCell>
                <TableCell sx={{ maxWidth: 360 }}>
                  <Tooltip title={errorText === '-' ? '' : errorText} placement="top" arrow>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {errorText}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default AuditLogsTable
