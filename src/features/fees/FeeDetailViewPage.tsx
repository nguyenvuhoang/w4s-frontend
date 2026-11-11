'use client'

import type { SvgIconComponent } from '@mui/icons-material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ApartmentIcon from '@mui/icons-material/Apartment'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import NotesIcon from '@mui/icons-material/Notes'
import PersonIcon from '@mui/icons-material/Person'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SpeedIcon from '@mui/icons-material/Speed'
import SubjectIcon from '@mui/icons-material/Subject'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import { useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { usePermission } from '@/shared/permissions/usePermission'
import SwalAlert from '@/shared/utils/SwalAlert'

import {
  FEE_DETAIL_EMPTY_VALUE,
  commonText,
  feeText,
  formatFeeDetailDate,
  formatFeeDetailDateTime,
  formatFeeDetailMoney,
  formatFeeTypeDisplay,
  getBooleanLabel,
  getFeeDetailActiveColor,
  getFeeDetailShowToResidentColor
} from './components/feeDetailHelpers'
import { feeService } from './service'
import type { FeeDetailItem, FeeDictionary, FeeWorkflowError } from './types'

type Props = {
  dictionary: FeeDictionary
  locale: string
  id: number
  detail: FeeDetailItem | null
  error?: FeeWorkflowError | null
  sessiontoken?: string
}

const DetailRow = ({
  label,
  icon: Icon,
  children
}: {
  label: string
  icon?: SvgIconComponent
  children: React.ReactNode
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {Icon && <Icon sx={{ fontSize: 17, color: 'text.secondary' }} />}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      </Stack>
      <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
        {children}
      </Box>
    </Stack>
  </Grid>
)

const SectionTitle = ({ icon: Icon, children }: { icon: SvgIconComponent; children: React.ReactNode }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
      {children}
    </Typography>
  </Stack>
)

const paymentStatusLabel = (dictionary: FeeDictionary, status: string | null) => {
  if (status === 'UNPAID') return feeText(dictionary, 'fee_invoice_status_unpaid', 'Unpaid')
  if (status === 'PAID') return feeText(dictionary, 'fee_invoice_status_paid', 'Paid')
  if (status === 'OVERDUE') return feeText(dictionary, 'fee_invoice_status_overdue', 'Overdue')
  return status || FEE_DETAIL_EMPTY_VALUE
}

const FeeDetailViewPage = ({ dictionary, locale, id, detail, error = null, sessiontoken }: Props) => {
  const router = useRouter()
  const project = useWorkingProject()
  const permission = usePermission({ href: '/fee-management' })
  const [submitting, setSubmitting] = useState(false)
  const feeTypeDisplay = formatFeeTypeDisplay(detail?.fee_type)
  const canEditInvoice = permission.resolved && permission.canModify
  const hasProjectScope = Boolean(project?.code) && (!detail?.project_id || detail.project_id === project?.id)
  const canModify = canEditInvoice
  const canDelete = permission.resolved && permission.canDelete
  const isVisibilityAvailable = detail?.fee_period_id !== null && detail?.fee_period_id !== undefined
  const text = (key: string, fallback: string) => feeText(dictionary, key, fallback)

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()

      return
    }

    router.push(`/${locale}/fee-management`)
  }

  const showUnavailableProjectMessage = () => {
    SwalAlert('warning', text('fee_invoice_action_project_unavailable', 'Select the invoice project before performing this action.'), 'top', false)
  }

  const deleteInvoice = () => {
    if (!detail || !canDelete || submitting) return
    if (!hasProjectScope) {
      showUnavailableProjectMessage()
      return
    }

    SwalAlert('question', '', 'top', false, true, true, () => {
      void (async () => {
        setSubmitting(true)
        try {
          await feeService.deleteFeeInvoice({ sessiontoken, language: locale as 'vi' | 'en', scope: project!.code, id: detail.id })
          SwalAlert('success', text('fee_invoice_delete_success', 'Fee invoice deleted successfully.'), 'top', false)
          router.push(`/${locale}/fee-management`)
        } catch (cause) {
          SwalAlert('error', cause, 'top', false)
        } finally {
          setSubmitting(false)
        }
      })()
    }, text('confirm', 'Confirm'), {
      title: text('fee_invoice_delete', 'Delete fee invoice'),
      cancelButtonText: text('cancel', 'Cancel'),
      html: text('fee_invoice_delete_confirm', 'Delete this fee invoice?')
    })
  }

  const toggleActive = () => {
    if (!detail || !canModify || submitting) return
    if (!hasProjectScope) {
      showUnavailableProjectMessage()
      return
    }

    const nextValue = detail.is_active !== true
    SwalAlert('question', '', 'top', false, true, true, () => {
      void (async () => {
        setSubmitting(true)
        try {
          await feeService.toggleFeeActiveStatus({ sessiontoken, language: locale as 'vi' | 'en', scope: project!.code, invoiceIds: [detail.id], isActive: nextValue })
          router.refresh()
        } catch (cause) {
          SwalAlert('error', cause, 'top', false)
        } finally {
          setSubmitting(false)
        }
      })()
    }, text('confirm', 'Confirm'), {
      title: nextValue ? text('fee_invoice_activate', 'Activate') : text('fee_invoice_deactivate', 'Deactivate'),
      cancelButtonText: text('cancel', 'Cancel'),
      html: nextValue ? text('fee_invoice_activate_confirm', 'Activate this fee invoice?') : text('fee_invoice_deactivate_confirm', 'Deactivate this fee invoice?')
    })
  }

  const toggleVisibility = () => {
    if (!detail || !canModify || submitting) return
    if (!hasProjectScope) {
      showUnavailableProjectMessage()
      return
    }
    if (!isVisibilityAvailable) {
      SwalAlert('warning', text('fee_invoice_visibility_period_required', 'Visibility cannot be changed because this invoice has no fee period.'), 'top', false)
      return
    }

    const nextValue = detail.is_show_to_resident !== true
    SwalAlert('question', '', 'top', false, true, true, () => {
      void (async () => {
        setSubmitting(true)
        try {
          await feeService.toggleFeeVisibility({ sessiontoken, language: locale as 'vi' | 'en', scope: project!.code, invoiceIds: [detail.id], feePeriodId: detail.fee_period_id!, isShowToResident: nextValue })
          router.refresh()
        } catch (cause) {
          SwalAlert('error', cause, 'top', false)
        } finally {
          setSubmitting(false)
        }
      })()
    }, text('confirm', 'Confirm'), {
      title: nextValue ? text('fee_invoice_show_to_resident', 'Show to resident') : text('fee_invoice_hide_from_resident', 'Hide from resident'),
      cancelButtonText: text('cancel', 'Cancel'),
      html: nextValue ? text('fee_invoice_show_to_resident_confirm', 'Show this fee invoice to residents?') : text('fee_invoice_hide_from_resident_confirm', 'Hide this fee invoice from residents?')
    })
  }

  return (
    <ContentWrapper
      title={feeText(dictionary, 'fee_detail_view_page_title', 'Fee Record Detail')}
      description={feeText(dictionary, 'fee_detail_view_page_subtitle', 'View fee record information.')}
      icon={<ReceiptLongIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack} disabled={submitting}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>
          {!permission.resolved ? (
            <CircularProgress size={24} aria-label={text('permission_loading', 'Loading permissions')} />
          ) : (
            <>
              {canEditInvoice && (
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} disabled={submitting || !detail || !id || !hasProjectScope} onClick={() => detail && router.push(`/${locale}/fee-management/view-detail/${detail.id}/edit`)}>
                  {text('fee_invoice_edit_action', 'Edit')}
                </Button>
              )}
              {canDelete && detail && (
                <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} disabled={submitting || !hasProjectScope} onClick={deleteInvoice}>
                  {text('delete', 'Delete')}
                </Button>
              )}
              {canModify && detail && (
                <Button variant="outlined" color={detail.is_active === true ? 'warning' : 'success'} startIcon={<CheckCircleIcon />} disabled={submitting || !hasProjectScope} onClick={toggleActive}>
                  {detail.is_active === true ? text('fee_invoice_deactivate', 'Deactivate') : text('fee_invoice_activate', 'Activate')}
                </Button>
              )}
              {canModify && detail && (
                <Tooltip title={!isVisibilityAvailable ? text('fee_invoice_visibility_period_required', 'Visibility cannot be changed because this invoice has no fee period.') : ''}>
                  <span>
                    <Button variant="outlined" startIcon={<VisibilityIcon />} disabled={submitting || !hasProjectScope || !isVisibilityAvailable} onClick={toggleVisibility}>
                      {detail.is_show_to_resident === true ? text('fee_invoice_hide_from_resident', 'Hide from resident') : text('fee_invoice_show_to_resident', 'Show to resident')}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )}
        </Stack>

        {error ? (
          <WorkflowErrorAlert
            title={feeText(dictionary, 'fee_detail_view_load_failed', 'Unable to load fee detail.')}
            message={error.message}
            workflowId={error.workflowId}
            workflowLabel="Workflow"
            errorCode={error.errorCode}
            errorCodeLabel={dictionary.common?.errorcode ?? 'Error code'}
            executionId={error.executionId}
            executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copiedLabel={locale === 'vi' ? 'Đã sao chép' : 'Copied'}
            copySuccessMessage={dictionary.common?.copiedErrorReference ?? (locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference')}
            copyFailedMessage={locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.'}
            retryLabel={commonText(dictionary, 'retry', 'Retry')}
            onRetry={() => router.refresh()}
          />
        ) : !id || !detail ? (
          <Alert severity="warning">
            {feeText(dictionary, 'fee_detail_not_found', 'Fee record was not found.')}
          </Alert>
        ) : (
          <Stack spacing={3}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {detail.invoice_code || FEE_DETAIL_EMPTY_VALUE}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ApartmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {detail.full_unit_code || FEE_DETAIL_EMPTY_VALUE}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {detail.customer_name || FEE_DETAIL_EMPTY_VALUE}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                  <Chip
                    size="small"
                    color={getFeeDetailActiveColor(detail.is_active)}
                    label={detail.is_active
                      ? feeText(dictionary, 'status_active', 'Active')
                      : feeText(dictionary, 'status_inactive', 'Inactive')}
                    sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                  />
                </Stack>

                <Divider />

                <SectionTitle icon={InfoOutlinedIcon}>{feeText(dictionary, 'fee_detail_section_general', 'General information')}</SectionTitle>
                <Grid container spacing={3}>
                  <DetailRow label={feeText(dictionary, 'field_id', 'ID')}>
                    <Typography sx={{ fontWeight: 700 }}>{detail.id}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_invoice_code', 'Invoice code')} icon={ReceiptLongIcon}>
                    <Typography>{detail.invoice_code || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_full_unit_code', 'Apartment code')} icon={ApartmentIcon}>
                    <Typography>{detail.full_unit_code || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_customer_name', 'Customer')} icon={PersonIcon}>
                    <Typography>{detail.customer_name || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'project', 'Project')}>
                    <Typography>{detail.project_code || detail.project_id || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_unit_id', 'Unit ID')}>
                    <Typography>{detail.unit_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_package_id', 'Package ID')}>
                    <Typography>{detail.package_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_fee_type_id', 'Fee type')} icon={LocalOfferIcon}>
                    {detail.fee_type?.name ? (
                      <Typography component="span">
                        {feeTypeDisplay.label}
                        {feeTypeDisplay.code && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            ({feeTypeDisplay.code})
                          </Typography>
                        )}
                      </Typography>
                    ) : (
                      <Typography>{detail.fee_type_code || detail.fee_type_id || FEE_DETAIL_EMPTY_VALUE}</Typography>
                    )}
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_fee_pay_status_id', 'Fee pay status ID')} icon={ScheduleIcon}>
                    <Typography>{detail.fee_pay_status_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_module_name', 'Module name')}>
                    <Typography>{detail.module_name || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_parent_id', 'Parent ID')}>
                    <Typography>{detail.parent_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                </Grid>

                <Divider />

                <SectionTitle icon={AccountBalanceWalletIcon}>{feeText(dictionary, 'fee_detail_section_amount', 'Amount information')}</SectionTitle>
                <Grid container spacing={3}>
                  <DetailRow label={feeText(dictionary, 'field_total_amount', 'Total amount')} icon={AccountBalanceWalletIcon}>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'success.main' }}>
                      {formatFeeDetailMoney(detail.total_amount, locale)}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_paid_amount', 'Paid amount')} icon={CreditCardIcon}>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatFeeDetailMoney(detail.paid_amount, locale)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_debit_amount', 'Outstanding / debit amount')} icon={CreditCardIcon}>
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'error.main' }}>
                      {formatFeeDetailMoney(detail.debit_amount, locale)}
                    </Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_from_index', 'From index')} icon={SpeedIcon}>
                    <Typography>{detail.from_index ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_to_index', 'To index')} icon={SpeedIcon}>
                    <Typography>{detail.to_index ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_total_used', 'Total used')} icon={SpeedIcon}>
                    <Typography>{detail.total_used ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                </Grid>

                <Divider />

                <SectionTitle icon={CalendarMonthIcon}>{feeText(dictionary, 'fee_detail_section_time', 'Time information')}</SectionTitle>
                <Grid container spacing={3}>
                  <DetailRow label={feeText(dictionary, 'field_inform_date', 'Inform date')} icon={CalendarMonthIcon}>
                    <Typography>{formatFeeDetailDate(detail.inform_date)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_from_date', 'From date')} icon={CalendarMonthIcon}>
                    <Typography>{formatFeeDetailDate(detail.from_date)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_to_date', 'To date')} icon={CalendarMonthIcon}>
                    <Typography>{formatFeeDetailDate(detail.to_date)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_due_date', 'Due date')} icon={CalendarMonthIcon}>
                    <Typography>{formatFeeDetailDate(detail.due_date)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_creation_time', 'Created at')} icon={CalendarMonthIcon}>
                    <Typography>{formatFeeDetailDateTime(detail.creation_time)}</Typography>
                  </DetailRow>
                </Grid>

                <Divider />

                <SectionTitle icon={NotesIcon}>{feeText(dictionary, 'fee_detail_section_additional', 'Additional information')}</SectionTitle>
                <Grid container spacing={3}>
                  <DetailRow label={feeText(dictionary, 'field_ref_id', 'Reference ID')}>
                    <Typography>{detail.ref_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_fee_generate_id', 'Fee generate ID')}>
                    <Typography>{detail.fee_generate_id ?? FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_payment_status', 'Payment status')}>
                    <Typography>{paymentStatusLabel(dictionary, detail.payment_status)}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_system_status', 'System status')}>
                    <Typography>{detail.system_status || FEE_DETAIL_EMPTY_VALUE}</Typography>
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_is_show_to_resident', 'Show to resident')} icon={VisibilityIcon}>
                    <Chip
                      size="small"
                      color={getFeeDetailShowToResidentColor(detail.is_show_to_resident)}
                      label={getBooleanLabel(detail.is_show_to_resident, locale, dictionary)}
                    />
                  </DetailRow>
                  <DetailRow label={feeText(dictionary, 'field_is_active', 'Active status')} icon={CheckCircleIcon}>
                    <Chip
                      size="small"
                      color={getFeeDetailActiveColor(detail.is_active)}
                      label={detail.is_active
                        ? feeText(dictionary, 'status_active', 'Active')
                        : feeText(dictionary, 'status_inactive', 'Inactive')}
                    />
                  </DetailRow>
                  <Grid size={{ xs: 12 }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <SubjectIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          {commonText(dictionary, 'description', 'Description')}
                        </Typography>
                      </Stack>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{detail.description || FEE_DETAIL_EMPTY_VALUE}</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default FeeDetailViewPage
