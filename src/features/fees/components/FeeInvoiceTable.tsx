import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import {
  Box,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Skeleton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { Fragment, useMemo, useState } from 'react'
import { useRouter } from '@/shared/hooks/useRouter'

import type { FeeApartmentGroup, FeeInvoiceItem, FeeDictionary } from '../types'
import { FEE_INVOICE_EMPTY_VALUE, feeText, formatFeeInvoiceMoney, getFeeInvoiceCreditCellSx, getFeeInvoiceStatusColor, getFeeInvoiceStatusLabel, splitFeeInvoiceBalance } from './feeInvoiceHelpers'

export type FeeInvoiceViewMode = 'list' | 'apartment'

type Props = {
  dictionary: FeeDictionary
  locale: string
  rows: FeeInvoiceItem[]
  apartmentGroups: FeeApartmentGroup[]
  loading: boolean
  pageSize: number
  viewMode: FeeInvoiceViewMode
  projectId: number | null
  selectedInvoiceIds: number[]
  onSelectedInvoiceIdsChange: (ids: number[]) => void
  onToggleVisibility: (row: FeeInvoiceItem, value: boolean) => void
  canOperate: boolean
  submitting: boolean
  paymentStatusCaptions: ReadonlyMap<string, string>
}

const headerCellSx = { bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }
const nowrapCellSx = { whiteSpace: 'nowrap' }

// Per-invoice receivable/credit cells from the API remaining_amount only (no amount - paid fallback).
const InvoiceBalanceCells = ({ row, locale }: { row: FeeInvoiceItem; locale: string }) => {
  const balance = splitFeeInvoiceBalance(row.api_remaining_amount)

  return <><TableCell sx={nowrapCellSx} align="right">{formatFeeInvoiceMoney(balance.receivable_amount, locale)}</TableCell><TableCell sx={{ ...nowrapCellSx, ...getFeeInvoiceCreditCellSx(balance.customer_credit_amount) }} align="right">{formatFeeInvoiceMoney(balance.customer_credit_amount, locale)}</TableCell></>
}
const columns = ['invoice_code', 'apartment_code', 'customer_name', 'fee_type_code', 'amount', 'remaining_amount', 'customer_credit_amount', 'is_show_to_resident', 'is_active', 'status'] as const
const rightAlignedColumns = new Set(['amount', 'remaining_amount', 'customer_credit_amount'])
const centeredColumns = new Set(['is_active'])
const columnLabelKeys: Record<typeof columns[number], string> = { invoice_code: 'field_invoice_code', apartment_code: 'field_full_unit_code', customer_name: 'field_customer_name', fee_type_code: 'field_fee_type_id', amount: 'fee_invoice_col_invoice_value', remaining_amount: 'fee_invoice_col_receivable_amount', customer_credit_amount: 'fee_invoice_col_customer_credit_amount', is_show_to_resident: 'field_is_show_to_resident', is_active: 'field_active_status', status: 'field_payment_status' }

const InvoiceVisibilitySwitch = ({ row, dictionary, canOperate, submitting, onToggleVisibility }: Pick<Props, 'dictionary' | 'canOperate' | 'submitting' | 'onToggleVisibility'> & { row: FeeInvoiceItem }) => {
  const stop = (event: React.SyntheticEvent) => event.stopPropagation()
  if (row.is_show_to_resident === null) return <>{FEE_INVOICE_EMPTY_VALUE}</>
  return <Tooltip title={row.is_show_to_resident ? feeText(dictionary, 'fee_invoice_switch_on', 'On') : feeText(dictionary, 'fee_invoice_switch_off', 'Off')}><span onClick={stop}><Switch size="small" color="success" disabled={submitting || !canOperate || !row.id || !row.project_id || !row.fee_period_id} checked={row.is_show_to_resident} onChange={event => onToggleVisibility(row, event.target.checked)} inputProps={{ 'aria-label': feeText(dictionary, 'field_is_show_to_resident', 'Show to resident') }} /></span></Tooltip>
}

const InvoiceStatus = ({ row, dictionary, paymentStatusCaptions }: Pick<Props, 'dictionary' | 'paymentStatusCaptions'> & { row: FeeInvoiceItem }) => row.status ? <Chip size="small" color={getFeeInvoiceStatusColor(row.status)} label={getFeeInvoiceStatusLabel(dictionary, row.status, paymentStatusCaptions)} /> : <>{FEE_INVOICE_EMPTY_VALUE}</>

const InvoiceActiveIcon = ({ row, dictionary }: Pick<Props, 'dictionary'> & { row: FeeInvoiceItem }) => row.is_active === null ? <>{FEE_INVOICE_EMPTY_VALUE}</> : <Tooltip title={row.is_active ? feeText(dictionary, 'fee_invoice_active', 'Active') : feeText(dictionary, 'fee_invoice_inactive', 'Inactive')}><span>{row.is_active ? <CheckCircleIcon color="success" sx={{ fontSize: 22, verticalAlign: 'middle' }} /> : <CancelIcon color="error" sx={{ fontSize: 22, verticalAlign: 'middle' }} />}</span></Tooltip>

const FeeInvoiceTable = ({ dictionary, locale, rows, apartmentGroups, loading, pageSize, viewMode, projectId, selectedInvoiceIds, onSelectedInvoiceIdsChange, onToggleVisibility, canOperate, submitting, paymentStatusCaptions }: Props) => {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const invoiceRows = useMemo(() => viewMode === 'apartment' ? apartmentGroups.flatMap(group => group.invoices) : rows, [apartmentGroups, rows, viewMode])
  const selectableIds = useMemo(() => invoiceRows.filter(row => row.id && row.project_id === projectId).map(row => row.id!), [invoiceRows, projectId])
  const selectedIds = useMemo(() => new Set(selectedInvoiceIds), [selectedInvoiceIds])
  const selectedOnPage = selectableIds.filter(id => selectedIds.has(id))
  const openDetail = (row: FeeInvoiceItem) => { if (row.id) router.push(`/${locale}/fee-management/view-detail/${row.id}`) }
  const toggleGroup = (key: string) => setExpanded(current => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next })
  const toggleSelection = (row: FeeInvoiceItem) => {
    if (!row.id || row.project_id !== projectId) return
    const next = new Set(selectedIds)
    next.has(row.id) ? next.delete(row.id) : next.add(row.id)
    onSelectedInvoiceIdsChange(Array.from(next))
  }
  const toggleCurrentPage = () => onSelectedInvoiceIdsChange(selectedOnPage.length === selectableIds.length ? selectedInvoiceIds.filter(id => !selectableIds.includes(id)) : Array.from(new Set([...selectedInvoiceIds, ...selectableIds])))
  const toggleGroupSelection = (group: FeeApartmentGroup) => {
    const groupIds = group.invoices.filter(row => row.id && row.project_id === projectId).map(row => row.id!)
    const next = new Set(selectedIds)
    const allSelected = groupIds.length > 0 && groupIds.every(id => next.has(id))
    groupIds.forEach(id => allSelected ? next.delete(id) : next.add(id))
    onSelectedInvoiceIdsChange(Array.from(next))
  }
  const groupSelectionCheckbox = (group: FeeApartmentGroup) => {
    const groupIds = group.invoices.filter(row => row.id && row.project_id === projectId).map(row => row.id!)
    const count = groupIds.filter(id => selectedIds.has(id)).length
    return <Checkbox size="small" checked={groupIds.length > 0 && count === groupIds.length} indeterminate={count > 0 && count < groupIds.length} disabled={!canOperate || !groupIds.length || submitting} onClick={event => event.stopPropagation()} onChange={() => toggleGroupSelection(group)} inputProps={{ 'aria-label': feeText(dictionary, 'fee_invoice_select', 'Select invoice') }} />
  }
  const selectionCheckbox = (row: FeeInvoiceItem) => <Checkbox size="small" checked={Boolean(row.id && selectedIds.has(row.id))} disabled={!canOperate || !row.id || row.project_id !== projectId || submitting} onClick={event => event.stopPropagation()} onChange={() => toggleSelection(row)} inputProps={{ 'aria-label': feeText(dictionary, 'fee_invoice_select', 'Select invoice') }} />
  const selectAllCheckbox = <Checkbox size="small" checked={selectableIds.length > 0 && selectedOnPage.length === selectableIds.length} indeterminate={selectedOnPage.length > 0 && selectedOnPage.length < selectableIds.length} disabled={!canOperate || !selectableIds.length || submitting} onChange={toggleCurrentPage} inputProps={{ 'aria-label': feeText(dictionary, 'fee_invoice_select_page', 'Select invoices on this page') }} />

  if (viewMode === 'apartment') {
    return <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}><Typography variant="caption" color="text.secondary">{feeText(dictionary, 'fee_invoice_group_backend_scope_note', 'Apartment totals and pagination are provided by the server.')}</Typography></Box>
      <TableContainer sx={{ maxHeight: 640 }}><Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
        <TableHead><TableRow><TableCell padding="checkbox" sx={headerCellSx}>{selectAllCheckbox}</TableCell>{['', 'field_full_unit_code', 'field_customer_name', 'fee_invoice_fee_count', 'field_total_amount', 'fee_invoice_total_paid', 'fee_invoice_total_outstanding', 'fee_invoice_unpaid_count'].map((key, index) => <TableCell key={key || 'expand'} sx={headerCellSx} align={index >= 4 ? 'right' : 'left'}>{key ? feeText(dictionary, key, key) : ''}</TableCell>)}</TableRow></TableHead>
        <TableBody>{loading ? Array.from({ length: pageSize }).map((_, index) => <TableRow key={index}>{Array.from({ length: 9 }).map((__, cell) => <TableCell key={cell}><Skeleton height={28} /></TableCell>)}</TableRow>) : apartmentGroups.length === 0 ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{feeText(dictionary, 'fee_invoice_empty_title', 'No fee invoices found.')}</Typography></TableCell></TableRow> : apartmentGroups.map((group, groupIndex) => <Fragment key={`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`}>
          <TableRow hover onClick={() => toggleGroup(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`)} sx={{ cursor: 'pointer', bgcolor: 'action.hover', '& > *': { fontWeight: 700 } }}>
            <TableCell padding="checkbox">{groupSelectionCheckbox(group)}</TableCell><TableCell padding="checkbox"><Tooltip title={expanded.has(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`) ? feeText(dictionary, 'fee_invoice_collapse', 'Collapse') : feeText(dictionary, 'fee_invoice_expand', 'Expand')}><IconButton size="small" aria-label={expanded.has(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`) ? feeText(dictionary, 'fee_invoice_collapse', 'Collapse') : feeText(dictionary, 'fee_invoice_expand', 'Expand')} onClick={event => { event.stopPropagation(); toggleGroup(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`) }}>{expanded.has(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`) ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton></Tooltip></TableCell>
            <TableCell sx={nowrapCellSx}>{group.apartment_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx}>{group.customer_name || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell>{group.invoice_count ?? FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell align="right">{formatFeeInvoiceMoney(group.total_amount, locale)}</TableCell><TableCell align="right">{formatFeeInvoiceMoney(group.total_paid_amount, locale)}</TableCell><TableCell align="right">{formatFeeInvoiceMoney(group.remaining_amount, locale)}</TableCell><TableCell align="right">{FEE_INVOICE_EMPTY_VALUE}</TableCell>
          </TableRow>
          <TableRow><TableCell colSpan={9} sx={{ py: 0, borderBottom: 0 }}><Collapse in={expanded.has(`${group.project_id ?? 'none'}:${group.apartment_id ?? groupIndex}`)} timeout="auto" unmountOnExit><Box sx={{ p: 1.5, pl: { xs: 1.5, md: 5 }, bgcolor: 'background.default' }}><Table size="small" sx={{ minWidth: 1120 }}><TableHead><TableRow><TableCell padding="checkbox" sx={headerCellSx} />{['field_invoice_code', 'field_fee_type_id', 'fee_invoice_col_invoice_value', 'field_paid_amount', 'fee_invoice_col_receivable_amount', 'fee_invoice_col_customer_credit_amount', 'field_payment_status', 'field_is_show_to_resident', 'field_active_status'].map((key, index) => <TableCell key={key} sx={headerCellSx} align={index >= 2 && index <= 5 ? 'right' : index === 8 ? 'center' : 'left'}>{feeText(dictionary, key, key)}</TableCell>)}</TableRow></TableHead><TableBody>{group.invoices.map((row, index) => <TableRow key={row.id ?? index} hover onClick={() => openDetail(row)} sx={{ cursor: row.id ? 'pointer' : 'default' }}><TableCell padding="checkbox">{selectionCheckbox(row)}</TableCell><TableCell>{row.invoice_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell>{row.fee_type_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx} align="right">{formatFeeInvoiceMoney(row.amount, locale)}</TableCell><TableCell sx={nowrapCellSx} align="right">{formatFeeInvoiceMoney(row.paid_amount, locale)}</TableCell><InvoiceBalanceCells row={row} locale={locale} /><TableCell><InvoiceStatus row={row} dictionary={dictionary} paymentStatusCaptions={paymentStatusCaptions} /></TableCell><TableCell onClick={event => event.stopPropagation()}><InvoiceVisibilitySwitch row={row} dictionary={dictionary} canOperate={canOperate} submitting={submitting} onToggleVisibility={onToggleVisibility} /></TableCell><TableCell align="center"><InvoiceActiveIcon row={row} dictionary={dictionary} /></TableCell></TableRow>)}</TableBody></Table></Box></Collapse></TableCell></TableRow>
        </Fragment>)}</TableBody>
      </Table></TableContainer>
    </Paper>
  }

  return <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}><TableContainer sx={{ maxHeight: 640 }}><Table stickyHeader size="small" sx={{ minWidth: 1620 }}><TableHead><TableRow><TableCell padding="checkbox" sx={headerCellSx}>{selectAllCheckbox}</TableCell>{columns.map(column => <TableCell key={column} sx={headerCellSx} align={rightAlignedColumns.has(column) ? 'right' : centeredColumns.has(column) ? 'center' : 'left'}>{feeText(dictionary, columnLabelKeys[column], column)}</TableCell>)}</TableRow></TableHead><TableBody>{loading ? Array.from({ length: pageSize }).map((_, rowIndex) => <TableRow key={rowIndex}>{Array.from({ length: columns.length + 1 }).map((_, cell) => <TableCell key={cell}><Skeleton height={28} /></TableCell>)}</TableRow>) : rows.length === 0 ? <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{feeText(dictionary, 'fee_invoice_empty_title', 'No fee invoices found.')}</Typography></TableCell></TableRow> : rows.map((row, index) => <TableRow key={row.id ?? index} hover onClick={() => openDetail(row)} sx={{ cursor: row.id ? 'pointer' : 'default' }}><TableCell padding="checkbox">{selectionCheckbox(row)}</TableCell><TableCell sx={{ ...nowrapCellSx, fontWeight: 700 }}>{row.invoice_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx}>{row.apartment_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx}>{row.customer_name || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx}>{row.fee_type_code || FEE_INVOICE_EMPTY_VALUE}</TableCell><TableCell sx={nowrapCellSx} align="right">{formatFeeInvoiceMoney(row.amount, locale)}</TableCell><InvoiceBalanceCells row={row} locale={locale} /><TableCell sx={nowrapCellSx} onClick={event => event.stopPropagation()}><InvoiceVisibilitySwitch row={row} dictionary={dictionary} canOperate={canOperate} submitting={submitting} onToggleVisibility={onToggleVisibility} /></TableCell><TableCell sx={nowrapCellSx} align="center"><InvoiceActiveIcon row={row} dictionary={dictionary} /></TableCell><TableCell sx={nowrapCellSx}><InvoiceStatus row={row} dictionary={dictionary} paymentStatusCaptions={paymentStatusCaptions} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
}

export default FeeInvoiceTable
