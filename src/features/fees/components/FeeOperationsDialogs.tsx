'use client'

import CampaignIcon from '@mui/icons-material/Campaign'
import CloseIcon from '@mui/icons-material/Close'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Grid, IconButton, MenuItem, Stack, TextField, Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { buildingService } from '@/features/properties/building/buildingService'
import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { FeeDictionary, FeeInvoiceItem, FeeNotificationTemplateOption, FeePeriodItem } from '../types'
import { feeText, formatFeeInvoiceMoney } from './feeInvoiceHelpers'

type NotificationProps = {
  open: boolean; onClose: () => void; dictionary: FeeDictionary; locale: Locale; projectId: number | null; periodId: number | null
  projectLabel: string; projectScope?: string; sessiontoken?: string; periods: FeePeriodItem[]; templates: FeeNotificationTemplateOption[]; templatesLoading: boolean; templatesError: WorkflowErrorDetail | null; onOpen: () => void; submitting: boolean
  onSubmit: (fields: { project_id: number; fee_period_id: number; building_id: number | null; title: string; notification_template_id: number; exclude_zero_amount: boolean; exclude_paid: boolean; set_show_to_resident: boolean }) => Promise<void>
}

export const FeeNotificationDialog = ({ open, onClose, dictionary, locale, projectId, periodId, projectLabel, projectScope, sessiontoken, periods, templates, templatesLoading, templatesError, onOpen, submitting, onSubmit }: NotificationProps) => {
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [buildings, setBuildings] = useState<{ id: number; label: string }[]>([])
  const [buildingsLoading, setBuildingsLoading] = useState(false)
  const [buildingsError, setBuildingsError] = useState<string | null>(null)
  const [excludeZero, setExcludeZero] = useState(true)
  const [excludePaid, setExcludePaid] = useState(true)
  const [showToResident, setShowToResident] = useState(true)
  const initializedOpen = useRef(false)
  useEffect(() => {
    if (!open) { initializedOpen.current = false; return }
    if (initializedOpen.current) return
    initializedOpen.current = true
    onOpen()
    setTitle('')
    setTemplateId('')
    setSelectedPeriodId(periodId && periods.some(period => period.id === periodId) ? String(periodId) : '')
    setBuildingId('')
    setBuildingsError(null)
    if (!projectId || !sessiontoken) { setBuildings([]); return }
    setBuildingsLoading(true)
    void buildingService.simpleSearchBuildings({ sessiontoken, language: locale, scope: projectScope, filter: { project_id: projectId, search_text: '', page_index: 1, page_size: 100, status: '' } })
      .then(response => setBuildings(response.items.map(item => ({ id: item.id, label: item.name ? `${item.building_code} — ${item.name}` : item.building_code }))))
      .catch(() => { setBuildings([]); setBuildingsError(feeText(dictionary, 'fee_notification_building_load_failed', 'Unable to load buildings.')) })
      .finally(() => setBuildingsLoading(false))
  }, [dictionary, locale, onOpen, open, periodId, periods, projectId, projectScope, sessiontoken])
  const submit = async () => {
    if (!projectId || !selectedPeriodId || !title.trim() || !templateId) return
    try { await onSubmit({ project_id: projectId, fee_period_id: Number(selectedPeriodId), building_id: buildingId ? Number(buildingId) : null, title: title.trim(), notification_template_id: Number(templateId), exclude_zero_amount: excludeZero, exclude_paid: excludePaid, set_show_to_resident: showToResident }); SwalAlert('success', feeText(dictionary, 'fee_notification_sent', 'Fee notifications were sent.'), 'center'); onClose() }
    catch (error) { SwalAlert('error', error, 'center') }
  }
  return <Dialog open={open} onClose={(_event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose() }} disableEscapeKeyDown scroll="paper" fullWidth maxWidth="md" PaperProps={{ sx: { maxWidth: 800, maxHeight: 'calc(100% - 48px)', borderRadius: 2, overflow: 'hidden' } }}>
    <DialogTitle sx={{ position: 'relative', zIndex: 1, flexShrink: 0, px: 3, py: 2.5, color: 'common.white', background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <CampaignIcon sx={{ mt: .25, color: 'common.white' }} />
          <Box>
            <Typography variant="h6" sx={{ color: 'common.white', fontWeight: 800 }}>{feeText(dictionary, 'fee_notification_action', 'Send fee notification')}</Typography>
            <Typography variant="body2" sx={{ color: 'common.white', opacity: .88 }}>{feeText(dictionary, 'fee_notification_description', 'Choose the fee period and recipients before publishing.')}</Typography>
          </Box>
        </Stack>
        <IconButton aria-label={feeText(dictionary, 'close', 'Close')} onClick={onClose} sx={theme => ({ color: theme.palette.common.white, '& svg': { color: `${theme.palette.common.white} !important` }, '&:hover': { backgroundColor: alpha(theme.palette.common.white, .16) } })}><CloseIcon /></IconButton>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ p: 0, overflowY: 'auto' }}><Box sx={{ px: 3, pt: 3, pb: 2.5 }}><Stack spacing={2.5}>
      {templatesError && <Alert severity="error">{templatesError.message}{templatesError.executionId && <><br />{dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}: {templatesError.executionId}</>}</Alert>}{buildingsError && <Alert severity="error">{buildingsError}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={feeText(dictionary, 'project', 'Project')} value={projectLabel} InputProps={{ readOnly: true }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required select label={feeText(dictionary, 'fee_notification_period', 'Fee period')} value={selectedPeriodId} onChange={event => setSelectedPeriodId(event.target.value)}><MenuItem value="">{feeText(dictionary, 'fee_notification_select_period', 'Select fee period')}</MenuItem>{periods.filter(period => period.id !== null).map(period => <MenuItem key={period.id} value={period.id!}>{period.period_name || period.period_code}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select label={feeText(dictionary, 'fee_notification_building', 'Building')} value={buildingId} onChange={event => setBuildingId(event.target.value)} disabled={buildingsLoading}><MenuItem value="">{buildingsLoading ? feeText(dictionary, 'loading', 'Loading...') : feeText(dictionary, 'fee_notification_all_buildings', 'All buildings')}</MenuItem>{buildings.map(building => <MenuItem key={building.id} value={building.id}>{building.label}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required select label={feeText(dictionary, 'fee_notification_template', 'Notification template')} value={templateId} onChange={event => setTemplateId(event.target.value)} disabled={templatesLoading || templates.length === 0}><MenuItem value="">{templatesLoading ? feeText(dictionary, 'loading', 'Loading...') : feeText(dictionary, 'fee_notification_select_template', 'Select notification template')}</MenuItem>{templates.map(template => <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth required label={feeText(dictionary, 'fee_notification_title', 'Notification title')} value={title} onChange={event => setTitle(event.target.value)} /></Grid>
      </Grid>
      {!templatesLoading && templates.length === 0 && !templatesError && <Alert severity="info">{feeText(dictionary, 'fee_notification_template_empty', 'No active fee notification template is available.')}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} flexWrap="wrap" gap={{ xs: .5, md: 1.5 }} sx={{ pt: .5 }}><FormControlLabel sx={{ m: 0, alignItems: 'center' }} control={<Checkbox checked={excludeZero} onChange={event => setExcludeZero(event.target.checked)} />} label={feeText(dictionary, 'fee_notification_exclude_zero', 'Exclude zero-amount invoices')} /><FormControlLabel sx={{ m: 0, alignItems: 'center' }} control={<Checkbox checked={excludePaid} onChange={event => setExcludePaid(event.target.checked)} />} label={feeText(dictionary, 'fee_notification_exclude_paid', 'Exclude paid apartments')} /><FormControlLabel sx={{ m: 0, alignItems: 'center' }} control={<Checkbox checked={showToResident} onChange={event => setShowToResident(event.target.checked)} />} label={feeText(dictionary, 'fee_notification_show_resident', 'Show fees in resident app')} /></Stack>
    </Stack></Box></DialogContent>
    <DialogActions className="dialog-actions-bordered" sx={{ px: 3 }}><Button variant="outlined" sx={{ minHeight: 40 }} onClick={onClose} disabled={submitting}>{feeText(dictionary, 'cancel', 'Cancel')}</Button><Button variant="contained" sx={{ minHeight: 40 }} disabled={submitting || !projectId || !selectedPeriodId || !title.trim() || !templateId} onClick={() => void submit()}>{feeText(dictionary, 'fee_notification_submit', 'Send notification')}</Button></DialogActions>
  </Dialog>
}

type SettlementProps = { open: boolean; onClose: () => void; dictionary: FeeDictionary; locale: Locale; projectId: number | null; periodId: number | null; projectLabel: string; periods: FeePeriodItem[]; rows: FeeInvoiceItem[]; submitting: boolean; onSubmit: (fields: { project_id: number; apartment_id: number; fee_period_id: number; invoice_ids: number[]; paid_amount: number; payment_method: string; transaction_ref: string; notes: string }) => Promise<void> }

export const FeeSettlementDialog = ({ open, onClose, dictionary, locale, projectId, periodId, projectLabel, periods, rows, submitting, onSubmit }: SettlementProps) => {
  const apartments = useMemo(() => Array.from(new Map(rows.filter(row => row.apartment_id).map(row => [row.apartment_id!, row.apartment_code || String(row.apartment_id)])).entries()), [rows])
  const periodLabel = useMemo(() => periods.find(period => period.id === periodId)?.period_name || periods.find(period => period.id === periodId)?.period_code || '', [periodId, periods])
  const [apartmentId, setApartmentId] = useState('')
  const [invoiceIds, setInvoiceIds] = useState<number[]>([])
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [transactionRef, setTransactionRef] = useState('')
  const [notes, setNotes] = useState('')
  const invoices = rows.filter(row => row.apartment_id === Number(apartmentId) && (row.remaining_amount ?? 0) > 0 && row.id)
  const total = invoices.filter(row => invoiceIds.includes(row.id!)).reduce((sum, row) => sum + (row.remaining_amount ?? 0), 0)
  useEffect(() => { if (!open) return; setApartmentId(''); setInvoiceIds([]); setPaidAmount(''); setTransactionRef(''); setNotes('') }, [open, periodId])
  const executeSettlement = async () => {
    const amount = Number(paidAmount.replace(/,/g, ''))
    if (!projectId || !periodId || !apartmentId || !invoiceIds.length || !Number.isFinite(amount) || amount <= 0) return
    try { await onSubmit({ project_id: projectId, apartment_id: Number(apartmentId), fee_period_id: periodId, invoice_ids: invoiceIds, paid_amount: amount, payment_method: paymentMethod, transaction_ref: transactionRef.trim(), notes: notes.trim() }); SwalAlert('success', feeText(dictionary, 'fee_settlement_success', 'Fee settlement completed.'), 'center'); onClose() }
    catch (error) { SwalAlert('error', error, 'center') }
  }
  const submit = () => {
    if (!projectId || !periodId || !apartmentId || !invoiceIds.length || !paidAmount) return
    SwalAlert('question', '', 'center', false, true, true, () => { void executeSettlement() }, feeText(dictionary, 'fee_settlement_submit', 'Confirm collection'), { title: feeText(dictionary, 'fee_settlement_confirm_title', 'Confirm payment collection'), cancelButtonText: feeText(dictionary, 'cancel', 'Cancel'), html: feeText(dictionary, 'fee_settlement_confirm_message', 'Record this payment for the selected invoices?') })
  }
  return <Dialog open={open} onClose={(_event, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose() }} disableEscapeKeyDown scroll="paper" fullWidth maxWidth="md" PaperProps={{ sx: { maxWidth: 800, maxHeight: 'calc(100% - 48px)', borderRadius: 2, overflow: 'hidden' } }}>
    <DialogTitle sx={{ position: 'relative', zIndex: 1, flexShrink: 0, px: 3, py: 2.5, color: 'common.white', background: theme => `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})` }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start"><PointOfSaleIcon sx={{ mt: .25, color: 'common.white' }} /><Box><Typography variant="h6" sx={{ color: 'common.white', fontWeight: 800 }}>{feeText(dictionary, 'fee_settlement_action', 'Counter payment / settlement')}</Typography><Typography variant="body2" sx={{ color: 'common.white', opacity: .88 }}>{feeText(dictionary, 'fee_settlement_description', 'Record a direct payment and offset invoice balances.')}</Typography></Box></Stack>
        <IconButton aria-label={feeText(dictionary, 'close', 'Close')} onClick={onClose} sx={theme => ({ color: theme.palette.common.white, '& svg': { color: `${theme.palette.common.white} !important` }, '&:hover': { backgroundColor: alpha(theme.palette.common.white, .16) } })}><CloseIcon /></IconButton>
      </Stack>
    </DialogTitle>
    <DialogContent sx={{ p: 0, overflowY: 'auto' }}><Box sx={{ px: 3, pt: 3, pb: 2.5 }}><Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={feeText(dictionary, 'project', 'Project')} value={projectLabel} InputProps={{ readOnly: true }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={feeText(dictionary, 'fee_notification_period', 'Fee period')} value={periodLabel} InputProps={{ readOnly: true }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth select required label={feeText(dictionary, 'field_full_unit_code', 'Apartment')} value={apartmentId} onChange={event => { setApartmentId(event.target.value); setInvoiceIds([]) }}><MenuItem value="">{feeText(dictionary, 'fee_select_apartment', 'Select apartment')}</MenuItem>{apartments.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required select label={feeText(dictionary, 'fee_payment_method', 'Payment Method')} value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><MenuItem value="CASH">CASH</MenuItem><MenuItem value="BANK_TRANSFER">BANK_TRANSFER</MenuItem></TextField></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label={feeText(dictionary, 'fee_paid_amount', 'Paid amount')} value={paidAmount} onChange={event => setPaidAmount(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label={feeText(dictionary, 'fee_transaction_ref', 'Transaction reference')} value={transactionRef} onChange={event => setTransactionRef(event.target.value)} /></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={2} label={feeText(dictionary, 'fee_settlement_notes', 'Notes')} value={notes} onChange={event => setNotes(event.target.value)} /></Grid>
      </Grid>
      <Stack spacing={1}><Typography variant="subtitle2">{feeText(dictionary, 'fee_select_invoices', 'Unpaid invoices')}</Typography><Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1.5, py: .5 }}>{invoices.length ? invoices.map(invoice => <FormControlLabel key={invoice.id} sx={{ display: 'flex', alignItems: 'center', m: 0, py: .5 }} control={<Checkbox checked={invoiceIds.includes(invoice.id!)} onChange={event => setInvoiceIds(current => event.target.checked ? [...current, invoice.id!] : current.filter(id => id !== invoice.id))} />} label={<Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{invoice.invoice_code || invoice.id}</Typography><Typography variant="body2" color="text.secondary">{invoice.fee_type_code || '—'}</Typography><Typography variant="body2" color="text.secondary">{formatFeeInvoiceMoney(invoice.amount, locale)} · {formatFeeInvoiceMoney(invoice.remaining_amount, locale)}</Typography></Stack>} />) : <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{feeText(dictionary, 'fee_settlement_select_apartment_hint', 'Select an apartment to view unpaid invoices.')}</Typography>}</Box></Stack>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover', px: 2, py: 1.5 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Typography variant="body2">{feeText(dictionary, 'fee_settlement_invoice_count', 'Selected invoices')}: <strong>{invoiceIds.length}</strong></Typography><Typography variant="body2">{feeText(dictionary, 'fee_selected_outstanding', 'Selected outstanding')}: <strong>{formatFeeInvoiceMoney(total, locale)}</strong></Typography><Typography variant="body2">{feeText(dictionary, 'fee_paid_amount', 'Paid amount')}: <strong>{formatFeeInvoiceMoney(paidAmount ? Number(paidAmount) : 0, locale)}</strong></Typography></Stack></Box>
    </Stack></Box></DialogContent>
    <DialogActions className="dialog-actions-bordered" sx={{ px: 3 }}><Button variant="outlined" sx={{ minHeight: 40 }} onClick={onClose} disabled={submitting}>{feeText(dictionary, 'cancel', 'Cancel')}</Button><Button variant="contained" sx={{ minHeight: 40 }} disabled={submitting || !apartmentId || !invoiceIds.length || !paidAmount} onClick={submit}>{feeText(dictionary, 'fee_settlement_submit', 'Confirm collection')}</Button></DialogActions>
  </Dialog>
}
