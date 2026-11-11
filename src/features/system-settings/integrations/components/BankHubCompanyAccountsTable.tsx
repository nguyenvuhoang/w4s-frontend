'use client'

import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  formatBankHubAccountDateTime,
  getBankHubAccountActiveLabel,
  getBankHubAccountBankMeta,
  getBankHubAccountConnectionLabel,
  getBankHubAccountTypeLabel,
  isBankHubAccountActive,
  isBankHubAccountConnected
} from '../bankhub/bankhub-account.mapper'
import { displayBankHubValue as displayValue } from '../bankhub/bankhub-company.mapper'
import type { BankHubAccount } from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'
import BankHubCopyableValue from './BankHubCopyableValue'

type Props = {
  dictionary: SystemSettingsDictionary
  rows: BankHubAccount[]
  loading: boolean
  pageSize: number
}

const dataColumns = [
  'bank',
  'account_number',
  'account_holder_name',
  'account_type',
  'bank_api_connected',
  'active',
  'created_at',
  'xid'
] as const

type DataColumn = typeof dataColumns[number]

const columnWidths: Record<DataColumn, number> = {
  bank: 190,
  account_number: 160,
  account_holder_name: 200,
  account_type: 130,
  bank_api_connected: 140,
  active: 150,
  created_at: 170,
  xid: 260
}

const tableMinWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)

const truncateTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block'
}

const chipSx = { minWidth: 84, justifyContent: 'center' }

const SKELETON_ROWS = 3

/** Bank account XID (used as `bank_account_xid` in transaction requests) with an always-visible copy button. */
const AccountXid = ({ dictionary, xid }: { dictionary: SystemSettingsDictionary; xid: string }) => (
  <BankHubCopyableValue
    value={xid}
    copyLabel={integrationsText(dictionary, 'bankhub_account_copy_xid')}
    successMessage={integrationsText(dictionary, 'bankhub_account_copy_xid_success')}
    failedMessage={integrationsText(dictionary, 'bankhub_account_copy_xid_failed')}
  />
)

const BankCell = ({ account }: { account: BankHubAccount }) => {
  const bankMeta = getBankHubAccountBankMeta(account)

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="span" sx={{ ...truncateTextSx, fontWeight: 700, fontSize: 'inherit' }}>
        {displayValue(account.brand_name || account.bank_code)}
      </Typography>
      {bankMeta && (
        <Typography component="span" variant="caption" color="text.secondary" sx={truncateTextSx}>
          {bankMeta}
        </Typography>
      )}
    </Box>
  )
}

const ConnectionChip = ({ dictionary, account }: { dictionary: SystemSettingsDictionary; account: BankHubAccount }) => (
  <Chip
    size="small"
    variant="outlined"
    color={isBankHubAccountConnected(account) ? 'success' : 'default'}
    label={getBankHubAccountConnectionLabel(dictionary, account)}
    sx={chipSx}
  />
)

const ActiveChip = ({ dictionary, account }: { dictionary: SystemSettingsDictionary; account: BankHubAccount }) => (
  <Chip
    size="small"
    color={isBankHubAccountActive(account) ? 'success' : 'default'}
    label={getBankHubAccountActiveLabel(dictionary, account)}
    sx={chipSx}
  />
)

const MobileField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, flexShrink: 0 }}>
      {label}
    </Typography>
    <Box sx={{ minWidth: 0, display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>{children}</Box>
  </Stack>
)

const BankHubCompanyAccountsTable = ({ dictionary, rows, loading, pageSize }: Props) => {
  const t = (key: string) => integrationsText(dictionary, key)
  const getColumnLabel = (column: DataColumn) => t(`bankhub_account_column_${column}`)
  const skeletonCount = Math.min(rows.length || SKELETON_ROWS, pageSize || SKELETON_ROWS)

  if (!loading && rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('bankhub_company_bank_accounts_empty')}
      </Typography>
    )
  }

  return (
    <>
      {/* Desktop/tablet: table. CSS breakpoints (not useMediaQuery) so SSR and client markup match. */}
      <Paper
        variant="outlined"
        sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, overflow: 'hidden' }}
      >
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
            <colgroup>
              {dataColumns.map(column => <col key={column} style={{ width: columnWidths[column] }} />)}
            </colgroup>
            <TableHead>
              <TableRow>
                {dataColumns.map(column => (
                  <TableCell
                    key={column}
                    sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }}
                  >
                    {getColumnLabel(column)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: skeletonCount }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {dataColumns.map(column => (
                      <TableCell key={column}><Skeleton height={28} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.map((account, index) => (
                <TableRow key={account.xid || `bankhub-account-${index}`} hover>
                  <TableCell><BankCell account={account} /></TableCell>
                  <TableCell>
                    <Typography component="span" sx={{ ...truncateTextSx, fontFamily: 'monospace', fontSize: 14 }}>
                      {displayValue(account.account_number)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={account.account_holder_name || ''}>
                      <Typography component="span" sx={{ ...truncateTextSx, fontSize: 'inherit' }}>
                        {displayValue(account.account_holder_name)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getBankHubAccountTypeLabel(dictionary, account.account_type)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}><ConnectionChip dictionary={dictionary} account={account} /></Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}><ActiveChip dictionary={dictionary} account={account} /></Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatBankHubAccountDateTime(account.created_at)}</TableCell>
                  <TableCell><AccountXid dictionary={dictionary} xid={account.xid} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mobile: one card per account, XID + copy kept on its own line. */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={180} />
          ))
          : rows.map((account, index) => (
            <Paper key={account.xid || `bankhub-account-card-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <BankCell account={account} />
                  <ActiveChip dictionary={dictionary} account={account} />
                </Stack>
                <MobileField label={getColumnLabel('account_number')}>
                  <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {displayValue(account.account_number)}
                  </Typography>
                </MobileField>
                <MobileField label={getColumnLabel('account_holder_name')}>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{displayValue(account.account_holder_name)}</Typography>
                </MobileField>
                <MobileField label={getColumnLabel('account_type')}>
                  <Typography>{getBankHubAccountTypeLabel(dictionary, account.account_type)}</Typography>
                </MobileField>
                <MobileField label={getColumnLabel('bank_api_connected')}>
                  <ConnectionChip dictionary={dictionary} account={account} />
                </MobileField>
                <MobileField label={getColumnLabel('created_at')}>
                  <Typography>{formatBankHubAccountDateTime(account.created_at)}</Typography>
                </MobileField>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {getColumnLabel('xid')}
                  </Typography>
                  <AccountXid dictionary={dictionary} xid={account.xid} />
                </Stack>
              </Stack>
            </Paper>
          ))}
      </Stack>
    </>
  )
}

export default BankHubCompanyAccountsTable
