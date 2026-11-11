'use client'

import { Box, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { displayBankHubValue as displayValue } from '../bankhub/bankhub-company.mapper'
import {
  formatBankHubTransactionAmount,
  formatBankHubTransactionDateTime,
  getBankHubTransactionWebhookLabel,
  getBankHubTransferTypeLabel,
  isBankHubTransactionCredit,
  isBankHubTransactionDebit,
  isBankHubTransactionWebhookSuccess
} from '../bankhub/bankhub-transaction.mapper'
import type { BankHubTransaction } from '../bankhub/bankhub.types'
import { integrationsText } from '../integrationModules'
import BankHubCopyableValue from './BankHubCopyableValue'

type Props = {
  dictionary: SystemSettingsDictionary
  rows: BankHubTransaction[]
  loading: boolean
  pageSize: number
}

const dataColumns = [
  'transaction_date',
  'brand_name',
  'account_number',
  'reference_number',
  'transfer_type',
  'amount',
  'transaction_content',
  'webhook_success',
  'transaction_id',
  'bank_account_xid'
] as const

type DataColumn = typeof dataColumns[number]

const columnWidths: Record<DataColumn, number> = {
  transaction_date: 170,
  brand_name: 110,
  account_number: 140,
  reference_number: 220,
  transfer_type: 110,
  amount: 140,
  transaction_content: 240,
  webhook_success: 150,
  transaction_id: 230,
  bank_account_xid: 230
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

const getAmountColor = (transaction: BankHubTransaction) => {
  if (isBankHubTransactionCredit(transaction)) return 'success.main'
  if (isBankHubTransactionDebit(transaction)) return 'error.main'

  return 'text.primary'
}

const TransferTypeChip = ({ dictionary, transaction }: { dictionary: SystemSettingsDictionary; transaction: BankHubTransaction }) => (
  <Chip
    size="small"
    variant="outlined"
    color={isBankHubTransactionCredit(transaction) ? 'success' : isBankHubTransactionDebit(transaction) ? 'error' : 'default'}
    label={getBankHubTransferTypeLabel(dictionary, transaction.transfer_type)}
    sx={chipSx}
  />
)

const WebhookChip = ({ dictionary, transaction }: { dictionary: SystemSettingsDictionary; transaction: BankHubTransaction }) => (
  <Chip
    size="small"
    color={isBankHubTransactionWebhookSuccess(transaction) ? 'success' : 'warning'}
    label={getBankHubTransactionWebhookLabel(dictionary, transaction)}
    sx={chipSx}
  />
)

const Amount = ({ transaction }: { transaction: BankHubTransaction }) => (
  <Typography component="span" sx={{ fontWeight: 700, color: getAmountColor(transaction), whiteSpace: 'nowrap', fontSize: 'inherit' }}>
    {formatBankHubTransactionAmount(transaction)}
  </Typography>
)

const MobileField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, flexShrink: 0 }}>
      {label}
    </Typography>
    <Box sx={{ minWidth: 0, display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>{children}</Box>
  </Stack>
)

const BankHubCompanyTransactionsTable = ({ dictionary, rows, loading, pageSize }: Props) => {
  const t = (key: string) => integrationsText(dictionary, key)
  const getColumnLabel = (column: DataColumn) => t(`bankhub_transaction_column_${column}`)
  const skeletonCount = Math.min(rows.length || SKELETON_ROWS, pageSize || SKELETON_ROWS)

  const renderCopyable = (column: 'transaction_id' | 'bank_account_xid' | 'reference_number', value: string) => (
    <BankHubCopyableValue
      value={value}
      copyLabel={t('bankhub_transaction_copy')}
      successMessage={t(`bankhub_transaction_copy_${column}_success`)}
      failedMessage={t('bankhub_transaction_copy_failed')}
    />
  )

  if (!loading && rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('bankhub_transaction_empty')}
      </Typography>
    )
  }

  return (
    <>
      {/* Desktop/tablet: table with horizontal scroll. CSS breakpoints so SSR and client markup match. */}
      <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' }, borderRadius: 2, overflow: 'hidden' }}>
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
                    align={column === 'amount' ? 'right' : 'left'}
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
              ) : rows.map((transaction, index) => (
                <TableRow key={transaction.transaction_id || `bankhub-transaction-${index}`} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatBankHubTransactionDateTime(transaction.transaction_date)}
                  </TableCell>
                  <TableCell>
                    <Typography component="span" sx={{ ...truncateTextSx, fontWeight: 700, fontSize: 'inherit' }}>
                      {displayValue(transaction.brand_name)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography component="span" sx={{ ...truncateTextSx, fontFamily: 'monospace', fontSize: 14 }}>
                      {displayValue(transaction.account_number)}
                    </Typography>
                  </TableCell>
                  <TableCell>{renderCopyable('reference_number', transaction.reference_number)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}><TransferTypeChip dictionary={dictionary} transaction={transaction} /></Box>
                  </TableCell>
                  <TableCell align="right"><Amount transaction={transaction} /></TableCell>
                  <TableCell>
                    <Tooltip title={transaction.transaction_content || ''}>
                      <Typography component="span" sx={{ ...truncateTextSx, fontSize: 'inherit' }}>
                        {displayValue(transaction.transaction_content)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}><WebhookChip dictionary={dictionary} transaction={transaction} /></Box>
                  </TableCell>
                  <TableCell>{renderCopyable('transaction_id', transaction.transaction_id)}</TableCell>
                  <TableCell>{renderCopyable('bank_account_xid', transaction.bank_account_xid)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Mobile: one card per transaction, IDs + copy kept on their own lines. */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {loading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={220} />
          ))
          : rows.map((transaction, index) => (
            <Paper
              key={transaction.transaction_id || `bankhub-transaction-card-${index}`}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>{displayValue(transaction.brand_name)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatBankHubTransactionDateTime(transaction.transaction_date)}
                    </Typography>
                  </Box>
                  <Amount transaction={transaction} />
                </Stack>
                <MobileField label={getColumnLabel('account_number')}>
                  <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {displayValue(transaction.account_number)}
                  </Typography>
                </MobileField>
                <MobileField label={getColumnLabel('transfer_type')}>
                  <TransferTypeChip dictionary={dictionary} transaction={transaction} />
                </MobileField>
                <MobileField label={getColumnLabel('webhook_success')}>
                  <WebhookChip dictionary={dictionary} transaction={transaction} />
                </MobileField>
                <MobileField label={getColumnLabel('transaction_content')}>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{displayValue(transaction.transaction_content)}</Typography>
                </MobileField>
                {(['reference_number', 'transaction_id', 'bank_account_xid'] as const).map(column => (
                  <Stack key={column} spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {getColumnLabel(column)}
                    </Typography>
                    {renderCopyable(column, transaction[column])}
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}
      </Stack>
    </>
  )
}

export default BankHubCompanyTransactionsTable
