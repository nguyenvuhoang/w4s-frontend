'use client'

import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useRouter } from '@shared/hooks/useRouter'
import { useEffect, useRef, useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'

import { formatFeeInvoiceMoney, getFeeInvoiceCreditCellSx } from '../components/feeInvoiceHelpers'
import { feeText } from '../components/feeTypeHelpers'
import { getFeeImportAcceptButton } from './feeImportApproval'
import { splitOutstandingAmount } from './feeImportWorkflow.mapper'
import { feeImportWorkflowService } from './feeImportWorkflow.service'
import type { FeeImportDetailSearchResponse, FeeImportItem } from './feeImportWorkflow.types'

const allowed = (status: string) => !['ACCEPTED', 'APPROVED', 'COMPLETED'].includes(status.toUpperCase())
const display = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '-' : String(value)
const date = (value: string | null, locale: string) => value ? new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-'
const headerSx = { bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, whiteSpace: 'nowrap' }
export default function FeeImportDetailPage({ dictionary, locale, sessiontoken, id, initial, initialScope }: { dictionary: any; locale: string; sessiontoken?: string; id: number; initial?: FeeImportItem | null; initialScope?: string | null }) {
  const router = useRouter(); const project = useWorkingProject(); const t = (key: string, fallback: string) => feeText(dictionary, key, fallback); const permission = usePermission({ href: '/fee-import' }); const [item, setItem] = useState(initial ?? null); const [rows, setRows] = useState<(FeeImportDetailSearchResponse & { requestKey: string }) | null>(null); const [busy, setBusy] = useState(false); const loadedScope = useRef(initial && initialScope ? initialScope : null); const requestedScope = useRef<string | null>(null); const submitting = useRef(false); const [acceptSubmitted, setAcceptSubmitted] = useState(false)
  const acceptButton = getFeeImportAcceptButton(item?.id === id ? item : null, permission, acceptSubmitted)
  const requestKey = `${project?.code}:${id}`
  const load = async () => {
    if (!project?.id || !project.code || requestedScope.current === requestKey) return
    requestedScope.current = requestKey
    try {
      const reuseInitial = Boolean(item?.id === id && loadedScope.current === project.code)
      const serverInitial = initial?.id === id && initialScope === project.code ? initial : null

      if (!reuseInitial) { setItem(null); setRows(null) }
      const result = serverInitial ?? (reuseInitial ? item! : await feeImportWorkflowService.get({ sessiontoken, language: locale, scope: project.code, id }))

      if (requestedScope.current !== requestKey) return
      if (result.project_id && result.project_id !== project.id) { router.replace(`/${locale}/fee-import?project_id=${project.id}`); return }
      loadedScope.current = project.code
      setItem(result)
      const details = await feeImportWorkflowService.details({ sessiontoken, language: locale, scope: project.code, fee_import_id: id, system_status: '', filter: { project_id: project.id, search_text: '', status: '', page_index: 0, page_size: 20 } })

      if (requestedScope.current !== requestKey) return
      setRows({ ...details, requestKey })
    } catch (cause) {
      if (requestedScope.current !== requestKey) return
      requestedScope.current = null
      SwalAlert('error', cause, 'top', false)
    }
  }
  useEffect(() => { void load() }, [project?.code, project?.id, id])
  useEffect(() => { setAcceptSubmitted(false); submitting.current = false }, [id])
  const remove = () => { if (!permission.resolved || !permission.canDelete) return; SwalAlert('question', '', 'top', false, true, true, () => { void (async () => { if (!project?.code) return; setBusy(true); try { await feeImportWorkflowService.remove(sessiontoken, locale, project.code, id); SwalAlert('success', t('fee_import_delete_success', 'Fee import batch deleted.'), 'top', false); router.push(`/${locale}/fee-import`) } catch (cause) { SwalAlert('error', cause, 'top', false) } finally { setBusy(false) } })() }, t('confirm', 'Confirm'), { title: t('fee_import_delete', 'Delete import batch'), cancelButtonText: t('cancel', 'Cancel'), html: t('fee_import_delete_confirm', 'Delete this import batch?') }) }
  // Accept: blocked while disabled and guarded against double-submit. On success the batch is reloaded so the
  // button state follows the backend system_status; the button also stays disabled for this page session.
  const accept = () => { if (acceptButton.disabled || submitting.current) return; SwalAlert('question', '', 'top', false, true, true, () => { void (async () => { if (!project?.id || !project.code || submitting.current) return; submitting.current = true; setBusy(true); try { await feeImportWorkflowService.accept(sessiontoken, locale, project.code, project.id, id); setAcceptSubmitted(true); SwalAlert('success', t('fee_import_accept_success', 'Fee import batch accepted.'), 'top', false); try { setItem(await feeImportWorkflowService.get({ sessiontoken, language: locale, scope: project.code, id })) } catch (cause) { SwalAlert('error', cause, 'top', false) } } catch (cause) { submitting.current = false; SwalAlert('error', cause, 'top', false) } finally { setBusy(false) } })() }, t('confirm', 'Confirm'), { title: t('fee_import_accept', 'Accept fee import'), cancelButtonText: t('cancel', 'Cancel'), html: t('fee_import_accept_confirm', 'Accept this batch and create official fee invoices?') }) }
  const detailHeaders = ['#', t('fee_import_apartment', 'Apartment'), t('fee_import_fee_type', 'Fee type'), t('fee_import_document', 'Document'), t('fee_import_description_label', 'Description'), t('fee_import_invoice_value', 'Invoice value'), t('fee_import_receivable_amount', 'Outstanding receivable'), t('fee_import_customer_credit_amount', 'Customer credit balance'), t('fee_import_status', 'Status'), t('fee_import_error', 'Error')]
  const metadata = [
    [t('fee_import_code', 'Import code'), item?.import_code],
    [t('fee_import_file_name', 'File name'), item?.file_name],
    [t('fee_import_project', 'Project'), project ? `${project.code} - ${project.name}` : item?.project_name],
    [t('fee_import_fee_period', 'Fee period'), (rows?.requestKey === requestKey ? rows.period_name : null) ?? (item?.id === id ? item.fee_period_name : null)],
    [t('fee_import_import_date', 'Import date'), date(item?.import_date ?? null, locale)],
    [t('fee_import_notes', 'Notes'), item?.notes]
  ]
  const statistics = [[t('fee_import_total_rows', 'Total rows'), item?.total_rows], [t('fee_import_imported', 'Imported'), item?.imported_count], [t('fee_import_skipped', 'Skipped'), item?.skipped_count], [t('fee_import_updated', 'Updated'), item?.updated_count], [t('fee_import_errors', 'Errors'), item?.error_count]]
  return <ContentWrapper title={t('fee_import_detail', 'Fee import detail')} description={t('fee_import_detail_description', 'Review staging rows before accepting this fee import batch.')} icon={<UploadFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />} dictionary={dictionary}><Stack spacing={2} sx={{ mt: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent='flex-end' alignItems={{ xs: 'stretch', sm: 'center' }}><Button size='small' variant='outlined' startIcon={<ArrowBackIcon />} onClick={() => router.push(`/${locale}/fee-import`)}>{t('back', 'Back')}</Button>{permission.resolved && permission.canModify && item && allowed(item.status) && <Button size='small' variant='outlined' startIcon={<EditOutlinedIcon />} disabled={busy} onClick={() => router.push(`/${locale}/fee-import/${id}/edit`)}>{t('edit', 'Edit')}</Button>}{permission.resolved && permission.canDelete && item && allowed(item.status) && <Button size='small' variant='outlined' color='error' startIcon={<DeleteOutlineIcon />} disabled={busy} onClick={remove}>{t('delete', 'Delete')}</Button>}{acceptButton.visible && <Button size='small' variant='contained' startIcon={<CheckCircleOutlineIcon />} disabled={busy || acceptButton.disabled || submitting.current} onClick={accept}>{t('fee_import_accept', 'Accept fee import')}</Button>}</Stack><Paper variant='outlined' sx={{ p: { xs: 1.5, md: 2 } }}><Stack spacing={1.5}><Typography variant='h6'>{t('fee_import_information', 'Import information')}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>{metadata.map(([label, value]) => <Box key={label}><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography variant='body2' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{display(value)}</Typography></Box>)}<Box><Typography variant='caption' color='text.secondary'>{t('fee_import_status', 'Status')}</Typography><Box sx={{ mt: 0.25 }}>{acceptButton.state === 'accepted' ? <Chip size='small' color='success' label={t('fee_import_accepted', 'Accepted')} /> : acceptButton.state === 'rejected' ? <Chip size='small' color='error' label={t('fee_import_rejected', 'Rejected')} /> : <Chip size='small' label={display(item?.system_status ?? item?.status)} />}</Box></Box></Box><Typography variant='subtitle2'>{t('fee_import_statistics', 'Statistics')}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1 }}>{statistics.map(([label, value]) => <Paper key={label} variant='outlined' sx={{ p: 1 }}><Typography variant='caption' color='text.secondary'>{label}</Typography><Typography sx={{ fontWeight: 800 }}>{display(value)}</Typography></Paper>)}</Box></Stack></Paper><Paper sx={{ overflowX: 'auto', border: 1, borderColor: 'divider' }}><Table size='small'><TableHead><TableRow>{detailHeaders.map((label, index) => <TableCell key={label} align={index >= 5 && index <= 7 ? 'right' : 'left'} sx={headerSx}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{rows?.items.map((row, index) => { const outstanding = splitOutstandingAmount(row.outstanding_amount); return <TableRow key={row.id ?? index}><TableCell>{index + 1}</TableCell><TableCell>{display(row.apartment_code)}</TableCell><TableCell>{display(row.fee_type)}</TableCell><TableCell>{display(row.document_code)}</TableCell><TableCell>{display(row.description)}</TableCell><TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>{formatFeeInvoiceMoney(row.amount, locale)}</TableCell><TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>{formatFeeInvoiceMoney(outstanding.receivable_amount, locale)}</TableCell><TableCell align='right' sx={{ whiteSpace: 'nowrap', ...getFeeInvoiceCreditCellSx(outstanding.customer_credit_amount) }}>{formatFeeInvoiceMoney(outstanding.customer_credit_amount, locale)}</TableCell><TableCell>{display(row.system_status)}</TableCell><TableCell>{display(row.error_message)}</TableCell></TableRow> })}</TableBody></Table></Paper></Stack></ContentWrapper>
}
