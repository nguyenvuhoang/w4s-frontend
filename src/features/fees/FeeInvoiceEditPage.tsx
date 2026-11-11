'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { Alert, Breadcrumbs, Button, CircularProgress, Grid, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { commonText, feeText, formatFeeInvoiceMoney } from './components/feeInvoiceHelpers'
import { feeService } from './service'
import type { FeeDetailItem, FeeDictionary, UpdateFeeInvoiceRequest } from './types'

type Props = { dictionary: FeeDictionary; locale: string; detail: FeeDetailItem | null; sessiontoken?: string }

const toDateInputValue = (value: string | null) => value?.slice(0, 10) ?? ''

const FeeInvoiceEditPage = ({ dictionary, locale, detail, sessiontoken }: Props) => {
  const router = useRouter()
  const project = useWorkingProject()
  const permission = usePermission({ href: '/fee-management' })
  const text = (key: string, fallback: string) => feeText(dictionary, key, fallback)
  const [amount, setAmount] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAmount(detail?.total_amount === null || detail?.total_amount === undefined ? '' : String(detail.total_amount))
    setFromDate(toDateInputValue(detail?.from_date ?? null))
    setToDate(toDateInputValue(detail?.to_date ?? null))
    setDescription(detail?.description ?? '')
    setError(null)
  }, [detail])

  const isPaid = detail?.payment_status?.toUpperCase() === 'PAID' || (detail?.paid_amount ?? 0) > 0
  const hasProjectScope = Boolean(project?.code) && (!detail?.project_id || detail.project_id === project?.id)
  const parsedAmount = useMemo(() => Number(amount.replace(/[^0-9]/g, '')), [amount])
  const backToDetail = () => router.push(`/${locale}/fee-management/view-detail/${detail?.id ?? ''}`)

  const submit = async () => {
    if (!detail || saving) return
    if (!hasProjectScope) { setError(text('fee_invoice_action_project_unavailable', 'Select the invoice project before performing this action.')); return }
    if (!detail.apartment_id || !detail.fee_type_id || detail.paid_amount === null || detail.payment_status === null) { setError(text('fee_invoice_update_data_incomplete', 'The original invoice is missing data required for update.')); return }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !fromDate || !toDate || fromDate > toDate) { setError(text('fee_invoice_update_validation', 'Enter a valid amount and a valid date range.')); return }
    if (isPaid && parsedAmount !== detail.total_amount) { setError(text('fee_invoice_paid_amount_locked', 'The amount of a paid invoice cannot be changed.')); return }

    const fields: UpdateFeeInvoiceRequest = { id: detail.id, apartment_id: detail.apartment_id, fee_type_id: detail.fee_type_id, amount: parsedAmount, paid_amount: detail.paid_amount, from_date: fromDate, to_date: toDate, description: description.trim(), status: detail.payment_status }
    setSaving(true); setError(null)
    try {
      await feeService.updateFeeInvoice({ sessiontoken, language: locale as 'vi' | 'en', scope: project!.code, fields })
      router.refresh()
      SwalAlert('success', text('fee_invoice_update_success', 'Fee invoice updated successfully.'), 'center', false, false, true, backToDetail)
    } catch (cause) {
      const workflowError = normalizeWorkflowErrorDetail(cause, { fallback: text('fee_invoice_update_failed', 'Unable to update fee invoice.') })
      setError(workflowError.executionId ? `${workflowError.message}\n${dictionary.common?.executionid ?? 'Execution ID'}: ${workflowError.executionId}` : workflowError.message)
    } finally { setSaving(false) }
  }

  if (!permission.resolved) return <ContentWrapper title={text('fee_invoice_edit_title', 'Edit fee invoice')} description="" icon={<EditOutlinedIcon />} dictionary={dictionary}><Stack alignItems="center" sx={{ py: 5 }}><CircularProgress /></Stack></ContentWrapper>
  if (!permission.canModify) return <ContentWrapper title={text('fee_invoice_edit_title', 'Edit fee invoice')} description="" icon={<EditOutlinedIcon />} dictionary={dictionary}><Alert severity="error">{text('fee_invoice_edit_forbidden', 'You do not have permission to edit fee invoices.')}</Alert></ContentWrapper>
  if (!detail) return <ContentWrapper title={text('fee_invoice_edit_title', 'Edit fee invoice')} description="" icon={<EditOutlinedIcon />} dictionary={dictionary}><Alert severity="warning">{text('fee_detail_not_found', 'Fee record was not found.')}</Alert></ContentWrapper>

  return <ContentWrapper title={text('fee_invoice_edit_title', 'Edit fee invoice')} description={text('fee_invoice_edit_subtitle', 'Update the permitted fee invoice information.')} icon={<EditOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary}>
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}><Breadcrumbs><Link underline="hover" color="inherit" href={`/${locale}/fee-management`}>{text('fee_invoice_page_title', 'Fee Management')}</Link><Link underline="hover" color="inherit" href={`/${locale}/fee-management/view-detail/${detail.id}`}>{detail.invoice_code || text('fee_invoice_edit_title', 'Edit fee invoice')}</Link><Typography color="text.primary">{text('fee_invoice_edit_title', 'Edit fee invoice')}</Typography></Breadcrumbs><Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={backToDetail} disabled={saving}>{commonText(dictionary, 'back', 'Back')}</Button></Stack>
      <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}><Stack spacing={2.5}>
        {error && <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>{error}</Alert>}
        {isPaid && <Alert severity="info">{text('fee_invoice_paid_amount_locked', 'The amount of a paid invoice cannot be changed.')}</Alert>}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label={text('project', 'Project')} value={project ? `${project.code} — ${project.name}` : detail.project_code ?? ''} disabled /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label={text('field_full_unit_code', 'Apartment')} value={detail.apartment_code || detail.full_unit_code || '—'} disabled /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label={text('field_fee_type_id', 'Fee type')} value={detail.fee_type?.name || detail.fee_type_code || String(detail.fee_type_id ?? '—')} disabled /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required label={text('field_total_amount', 'Amount')} value={amount ? formatFeeInvoiceMoney(parsedAmount, locale) : ''} onChange={event => setAmount(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" disabled={saving || isPaid} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required type="date" label={text('field_from_date', 'From date')} value={fromDate} onChange={event => setFromDate(event.target.value)} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required type="date" label={text('field_to_date', 'To date')} value={toDate} onChange={event => setToDate(event.target.value)} disabled={saving} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
          <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={2} maxRows={3} label={commonText(dictionary, 'description', 'Description')} value={description} onChange={event => setDescription(event.target.value)} disabled={saving} /></Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" gap={1}><Button variant="outlined" onClick={backToDetail} disabled={saving}>{commonText(dictionary, 'cancel', 'Cancel')}</Button><Button variant="contained" disabled={saving || !hasProjectScope} onClick={() => void submit()}>{text('save', 'Save')}</Button></Stack>
      </Stack></Paper>
    </Stack>
  </ContentWrapper>
}

export default FeeInvoiceEditPage
