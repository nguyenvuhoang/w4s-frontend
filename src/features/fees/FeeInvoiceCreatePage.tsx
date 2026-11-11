'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Alert, Breadcrumbs, Button, Grid, Link, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { apartmentSearchService } from '@/features/properties/unit/services/apartmentSearchService'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

import { commonText, feeText, formatFeeInvoiceMoney } from './components/feeInvoiceHelpers'
import { useFeeInvoiceFilterOptions } from './hooks/useFeeInvoiceFilterOptions'
import { feeService } from './service'
import type { FeeDictionary } from './types'

type Props = { dictionary: FeeDictionary; locale: string; sessiontoken?: string }

const FeeInvoiceCreatePage = ({ dictionary, locale, sessiontoken }: Props) => {
  const router = useRouter()
  const project = useWorkingProject()
  const permission = usePermission({ href: '/fee-management' })
  const { feeTypes } = useFeeInvoiceFilterOptions({ sessiontoken, language: locale })
  const [apartments, setApartments] = useState<{ id: number; apartment_code: string }[]>([])
  const [apartmentId, setApartmentId] = useState('')
  const [feeTypeId, setFeeTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!project?.id || !sessiontoken) return
    void apartmentSearchService.simpleSearchApartments({ sessiontoken, language: locale as any, filter: { project_id: project.id, search_text: '', building_id: null, floor_id: null, status: 'A', qr_payment_enabled: 'all', page_index: 1, page_size: 100 } })
      .then(response => setApartments(response.items.map(item => ({ id: item.id, apartment_code: item.apartment_code }))))
      .catch(() => setApartments([]))
  }, [locale, project?.id, sessiontoken])

  const selectableFeeTypes = useMemo(() => feeTypes.filter(type => type.id && type.group_type !== 'SURPLUS'), [feeTypes])
  const back = () => router.push(`/${locale}/fee-management`)
  const submit = async () => {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''))
    if (!project?.id || !project.code || !apartmentId || !feeTypeId || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || saving) {
      setError(feeText(dictionary, 'fee_invoice_create_validation', 'Please complete all required fields with a valid amount.'))
      return
    }
    setSaving(true); setError(null)
    try {
      const result = await feeService.createFeeInvoice({ sessiontoken, language: locale as any, scope: project.code, fields: { project_id: null, apartment_id: Number(apartmentId), fee_type_id: Number(feeTypeId), amount: parsedAmount, description: description.trim() } })
      SwalAlert('success', feeText(dictionary, 'fee_invoice_create_success', 'Fee invoice created successfully.'), 'center', false, false, true, () => router.push(result.id ? `/${locale}/fee-management/view-detail/${result.id}` : `/${locale}/fee-management`))
      router.refresh()
    } catch (cause) {
      const detail = normalizeWorkflowErrorDetail(cause, { fallback: feeText(dictionary, 'fee_invoice_create_failed', 'Unable to create fee invoice.') })
      setError(detail.executionId ? `${detail.message}\n${dictionary.common?.executionid ?? 'Execution ID'}: ${detail.executionId}` : detail.message)
    } finally { setSaving(false) }
  }

  if (!permission.resolved) return null
  if (!permission.canAdd) return <ContentWrapper title={feeText(dictionary, 'fee_invoice_create_title', 'Create single fee')} description="" icon={<ReceiptLongIcon />} dictionary={dictionary}><Alert severity="error">{feeText(dictionary, 'fee_invoice_create_forbidden', 'You do not have permission to create fee invoices.')}</Alert></ContentWrapper>

  return <ContentWrapper title={feeText(dictionary, 'fee_invoice_create_title', 'Create single fee')} description={feeText(dictionary, 'fee_invoice_create_subtitle', 'Create a fee invoice for the current project.')} icon={<ReceiptLongIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary}>
    <Stack spacing={3} sx={{ mt: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5}><Breadcrumbs><Link underline="hover" color="inherit" href={`/${locale}/fee-management`}>{feeText(dictionary, 'fee_invoice_page_title', 'Fee Management')}</Link><Typography color="text.primary">{feeText(dictionary, 'fee_invoice_create_title', 'Create single fee')}</Typography></Breadcrumbs><Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={back} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>{commonText(dictionary, 'back', 'Back')}</Button></Stack>
      <Paper sx={{ p: { xs: 2, md: 3 }, width: '100%' }}><Stack spacing={2.5}>
        <Typography variant="h6">{feeText(dictionary, 'fee_invoice_create_title', 'Create single fee')}</Typography>
        {error && <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>{error}</Alert>}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth label={feeText(dictionary, 'project', 'Project')} value={project ? `${project.code} — ${project.name}` : ''} disabled /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required select label={feeText(dictionary, 'field_full_unit_code', 'Apartment')} value={apartmentId} onChange={event => setApartmentId(event.target.value)} disabled={!project}><MenuItem value="">{feeText(dictionary, 'fee_invoice_select_apartment', 'Select apartment')}</MenuItem>{apartments.map(item => <MenuItem key={item.id} value={item.id}>{item.apartment_code}</MenuItem>)}</TextField></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required select label={feeText(dictionary, 'field_fee_type_id', 'Fee type')} value={feeTypeId} onChange={event => setFeeTypeId(event.target.value)}><MenuItem value="">{feeText(dictionary, 'fee_invoice_select_fee_type', 'Select fee type')}</MenuItem>{selectableFeeTypes.map(item => <MenuItem key={item.id} value={item.id!}>{(locale === 'vi' ? item.name_translations.vi : item.name_translations.en) || item.name || item.fee_type_code}</MenuItem>)}</TextField></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}><TextField fullWidth required label={feeText(dictionary, 'field_total_amount', 'Amount')} value={amount ? formatFeeInvoiceMoney(Number(amount.replace(/[^0-9]/g, '')), locale) : ''} onChange={event => setAmount(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" /></Grid>
          <Grid size={{ xs: 12, sm: 6, md: 8 }}><TextField fullWidth multiline minRows={2} maxRows={3} label={commonText(dictionary, 'description', 'Description')} value={description} onChange={event => setDescription(event.target.value)} /></Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" gap={1}><Button onClick={back} disabled={saving}>{commonText(dictionary, 'cancel', 'Cancel')}</Button><Button variant="contained" disabled={saving} onClick={() => void submit()}>{feeText(dictionary, 'fee_invoice_create_submit', 'Create')}</Button></Stack>
      </Stack></Paper>
    </Stack>
  </ContentWrapper>
}

export default FeeInvoiceCreatePage
