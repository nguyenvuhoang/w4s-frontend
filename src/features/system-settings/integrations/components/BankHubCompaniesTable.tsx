'use client'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
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

import { useSearchTableRowConfig } from '@/shared/components/table'
import type { RowActionConfig } from '@/shared/components/table'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  displayBankHubValue as displayValue,
  getBankHubCompanyActiveLabel,
  getBankHubCompanyStatusLabel as getStatusLabel,
  isBankHubCompanyActiveStatus as isActiveStatus
} from '../bankhub/bankhub-company.mapper'
import type { BankHubCompany } from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'

type Props = {
  dictionary: SystemSettingsDictionary
  rows: BankHubCompany[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: BankHubCompany) => void
}

const dataColumns = ['provider', 'full_name', 'xid', 'status', 'is_active'] as const

type DataColumn = typeof dataColumns[number]

const columnWidths: Record<DataColumn, number> = {
  provider: 130,
  full_name: 360,
  xid: 320,
  status: 140,
  is_active: 140
}

const ACTIONS_COLUMN_WIDTH = 96

const tableMinWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)

const truncateTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block'
}

const chipSx = {
  minWidth: 84,
  justifyContent: 'center'
}

const getColumnLabel = (dictionary: SystemSettingsDictionary, column: DataColumn) => (
  integrationsText(dictionary, `bankhub_companies_column_${column}`)
)

const BankHubCompaniesTable = ({ dictionary, rows, loading, pageSize, onOpenDetail }: Props) => {
  const copyXid = async (row: BankHubCompany) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable.')

      await navigator.clipboard.writeText(row.xid)
      SwalAlert('success', integrationsText(dictionary, 'bankhub_companies_copy_xid_success'), 'top-end')
    } catch {
      SwalAlert('error', integrationsText(dictionary, 'bankhub_companies_copy_xid_failed'), 'top-end')
    }
  }

  const getRowActions = (): RowActionConfig<BankHubCompany>[] => [
    {
      key: 'detail',
      label: integrationsText(dictionary, 'bankhub_companies_action_detail'),
      icon: <VisibilityOutlinedIcon fontSize="small" />,
      visibleWhen: row => Boolean(row.xid),
      onClick: onOpenDetail
    },
    {
      key: 'copy-xid',
      label: integrationsText(dictionary, 'bankhub_companies_copy_xid'),
      icon: <ContentCopyIcon fontSize="small" />,
      visibleWhen: row => Boolean(row.xid),
      onClick: copyXid
    }
  ]

  // Row interaction follows the system-wide detail open mode (double-click by default).
  const table = useSearchTableRowConfig<BankHubCompany>({
    dictionary,
    rowInteraction: {
      onOpenDetail,
      isRowInteractive: row => Boolean(row.xid)
    },
    rowActions: getRowActions,
    rows,
    actionsColumnWidth: ACTIONS_COLUMN_WIDTH
  })

  const columnCount = dataColumns.length + (table.hasActionsColumn ? 1 : 0)
  const minWidth = tableMinWidth + (table.hasActionsColumn ? table.actionsColumnWidth : 0)

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth }}>
          <colgroup>
            {dataColumns.map(column => <col key={column} style={{ width: columnWidths[column] }} />)}
            {table.renderActionsCol()}
          </colgroup>
          <TableHead>
            <TableRow>
              {dataColumns.map(column => (
                <TableCell
                  key={column}
                  sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  {getColumnLabel(dictionary, column)}
                </TableCell>
              ))}
              {table.renderActionsHeaderCell()}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}><Skeleton height={28} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {integrationsText(dictionary, 'bankhub_companies_empty_title')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {integrationsText(dictionary, 'bankhub_companies_empty_description')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.map((row, index) => (
              <TableRow key={row.xid || `bankhub-company-${index}`} {...table.getRowProps(row)}>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Chip size="small" variant="outlined" color="info" label={displayValue(row.provider)} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={row.full_name || ''}>
                    <Typography component="span" sx={{ ...truncateTextSx, fontWeight: 700, fontSize: 'inherit' }}>
                      {displayValue(row.full_name)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={row.xid || ''}>
                    <Typography
                      component="span"
                      sx={{ ...truncateTextSx, fontFamily: 'monospace', fontSize: 13 }}
                    >
                      {displayValue(row.xid)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Chip
                      size="small"
                      color={isActiveStatus(row.status) ? 'success' : 'default'}
                      label={getStatusLabel(dictionary, row.status)}
                      sx={chipSx}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={row.is_active ? 'success' : 'default'}
                      label={getBankHubCompanyActiveLabel(dictionary, row.is_active)}
                      sx={chipSx}
                    />
                  </Box>
                </TableCell>
                {table.renderActionsCell(row)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default BankHubCompaniesTable
