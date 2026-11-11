'use client'

import { useMemo, useState } from 'react'

import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import {
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography
} from '@mui/material'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { ApplicationLogItem } from '../types'
import {
  applicationLogText,
  formatApplicationLogDateTime,
  formatApplicationLogDuration,
  getApplicationLogDirectionMeta,
  getApplicationLogLevelMeta
} from './applicationLogHelpers'

type Props = {
  locale: string
  rows: ApplicationLogItem[]
  loading: boolean
  pageSize: number
  onView: (row: ApplicationLogItem) => void
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const ApplicationLogsTable = ({ locale, rows, loading, pageSize, onView }: Props) => {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const timeA = a.log_timestamp ? new Date(a.log_timestamp).getTime() : 0
      const timeB = b.log_timestamp ? new Date(b.log_timestamp).getTime() : 0

      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA
    })

    return sorted
  }, [rows, sortDirection])

  const table = useSearchTableRowConfig<ApplicationLogItem>({
    rowInteraction: { onOpenDetail: onView }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>
                <TableSortLabel
                  active
                  direction={sortDirection}
                  IconComponent={sortDirection === 'asc' ? ArrowUpwardRounded : ArrowDownwardRounded}
                  onClick={() => setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))}
                  sx={{ color: 'inherit !important', '& .MuiTableSortLabel-icon': { color: 'inherit !important' } }}
                >
                  {applicationLogText(locale, 'Thời gian', 'Timestamp')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headerCellSx}>{applicationLogText(locale, 'Cấp độ', 'Level')}</TableCell>
              <TableCell sx={headerCellSx}>Service</TableCell>
              <TableCell sx={headerCellSx}>{applicationLogText(locale, 'Loại log', 'Log type')}</TableCell>
              <TableCell sx={headerCellSx}>Direction</TableCell>
              <TableCell sx={headerCellSx}>{applicationLogText(locale, 'Action/Flow', 'Action/Flow')}</TableCell>
              <TableCell sx={headerCellSx}>Duration</TableCell>
              <TableCell sx={headerCellSx}>Message</TableCell>
              <TableCell sx={headerCellSx}>{applicationLogText(locale, 'Thao tác', 'Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 9 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}><Skeleton height={28} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {applicationLogText(locale, 'Không tìm thấy nhật ký', 'No logs found')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedRows.map(row => {
              const levelMeta = getApplicationLogLevelMeta(row.log_level, locale)
              const directionMeta = getApplicationLogDirectionMeta(row.direction, locale)
              const messageText = row.message || '-'

              return (
                <TableRow
                  key={row.id}
                  {...table.getRowProps(row)}
                >
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatApplicationLogDateTime(row.log_timestamp, locale)}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={levelMeta.color} label={levelMeta.label} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{row.service_name || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.log_type || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{directionMeta.label}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.action_name || row.flow || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatApplicationLogDuration(row.duration)}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Tooltip title={messageText === '-' ? '' : messageText} placement="top" arrow>
                      <Typography
                        variant="body2"
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {messageText}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={applicationLogText(locale, 'Xem chi tiết', 'View detail')}>
                      <IconButton size="small" onClick={() => onView(row)}>
                        <VisibilityRounded fontSize="small" />
                      </IconButton>
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

export default ApplicationLogsTable
