'use client'

import AddIcon from '@mui/icons-material/Add'
import CampaignIcon from '@mui/icons-material/Campaign'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { usePermission } from '@/shared/permissions/usePermission'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'
import SwalAlert from '@/shared/utils/SwalAlert'

import FeeInvoiceFilterBar from './components/FeeInvoiceFilterBar'
import FeeInvoiceTable, { type FeeInvoiceViewMode } from './components/FeeInvoiceTable'
import FeePeriodOverviewDashboard from './components/FeePeriodOverviewDashboard'
import { FeeNotificationDialog, FeeSettlementDialog } from './components/FeeOperationsDialogs'
import { commonText, feeText } from './components/feeInvoiceHelpers'
import { useFeeInvoiceSearch } from './hooks/useFeeInvoiceSearch'
import { useFeeInvoiceFilterOptions } from './hooks/useFeeInvoiceFilterOptions'
import { useFeeManagementOperations } from './hooks/useFeeManagementOperations'
import type {
  FeeInvoiceFilterModel,
  FeeInvoiceSearchResponse,
  FeePageProps,
  FeePeriodItem,
  FeePeriodOverview,
  FeeWorkflowError
} from './types'

type Props = FeePageProps & {
  initialFilter: FeeInvoiceFilterModel
  initialData: FeeInvoiceSearchResponse
  initialError?: FeeWorkflowError | null
  initialPeriods: FeePeriodItem[]
  initialPeriodId: number | null
  initialOverview: FeePeriodOverview
  initialOverviewError?: FeeWorkflowError | null
}

const emptyOverview: FeePeriodOverview = { total_amount: null, paid_amount: null, remaining_amount: null, total_surplus_amount: null, paid_apartments: null, total_apartments: null }

const FeeInvoiceManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null,
  initialPeriods,
  initialPeriodId,
  initialOverview,
  initialOverviewError = null
}: Props) => {
  const router = useRouter()
  const workingProject = useWorkingProject()
  // ADD is a command child of the Fee Management menu, not a standalone `/fees/generate-fee` menu route.
  const createFeePermission = usePermission({ href: '/fee-management' })
  const canOperate = createFeePermission.resolved && createFeePermission.canModify
  const sessiontoken = session?.user?.token ?? undefined
  const [invoiceViewMode, setInvoiceViewMode] = useState<FeeInvoiceViewMode>('list')
  const feeInvoices = useFeeInvoiceSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError,
    scope: workingProject?.code,
    viewMode: invoiceViewMode
  })
  const { feeTypes } = useFeeInvoiceFilterOptions({ sessiontoken, language: locale })
  const paymentStatusCodeList = useCodeListCaptionMap({ code_group: 'IPS', code_name: 'FEE_INVOICE_STATUS', language: locale })
  const paymentStatuses = buildCodeListOptions(paymentStatusCodeList.items, locale)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [settlementOpen, setSettlementOpen] = useState(false)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([])
  const projectId = workingProject?.id ?? feeInvoices.filter.project_id ?? null
  const contextSwitchPending = Boolean(workingProject?.id && feeInvoices.filter.project_id !== workingProject.id)
  const operations = useFeeManagementOperations({ sessiontoken, language: locale, projectId, projectScope: workingProject?.code, onRefresh: feeInvoices.loadData, initialProjectId: initialFilter.project_id, initialPeriods, initialPeriodId: initialFilter.fee_period_id, initialOverview, initialOverviewError })
  const initialSearchKey = useRef<string | null>(null)
  const previousViewMode = useRef<FeeInvoiceViewMode>(invoiceViewMode)
  const visibleRows = useMemo(() => invoiceViewMode === 'apartment' ? feeInvoices.apartmentGroups.flatMap(group => group.invoices) : feeInvoices.rows, [feeInvoices.apartmentGroups, feeInvoices.rows, invoiceViewMode])
  const selectedRows = useMemo(() => visibleRows.filter(row => row.id && row.project_id === projectId && selectedInvoiceIds.includes(row.id)), [projectId, selectedInvoiceIds, visibleRows])
  useEffect(() => setSelectedInvoiceIds(current => current.filter(id => visibleRows.some(row => row.id === id && row.project_id === projectId))), [projectId, visibleRows])
  useEffect(() => {
    if (previousViewMode.current === invoiceViewMode) return
    previousViewMode.current = invoiceViewMode
    setSelectedInvoiceIds([])
    void feeInvoices.loadData({ ...feeInvoices.filter, page_index: 1 })
  }, [invoiceViewMode])
  useEffect(() => {
    if (!workingProject?.id || !workingProject.code) return
    const next = { ...feeInvoices.draftFilter, project_id: workingProject.id, fee_period_id: operations.periodId, page_index: 1 }
    const key = `${workingProject.id}:${workingProject.code}:${operations.periodId ?? 'all'}`
    if (initialSearchKey.current === key) return
    initialSearchKey.current = key
    feeInvoices.updateDraftFilter('project_id', workingProject.id)
    feeInvoices.updateDraftFilter('fee_period_id', operations.periodId)
    void feeInvoices.loadData(next)
  }, [feeInvoices, operations.periodId, workingProject?.code, workingProject?.id])
  const changeFeePeriod = (feePeriodId: number | null) => {
    const next = { ...feeInvoices.draftFilter, fee_period_id: feePeriodId, page_index: 1 }
    if (workingProject?.id && workingProject.code) initialSearchKey.current = `${workingProject.id}:${workingProject.code}:${feePeriodId ?? 'all'}`
    operations.setPeriodId(feePeriodId)
    feeInvoices.updateDraftFilter('fee_period_id', feePeriodId)
    void feeInvoices.loadData(next)
  }
  const resetFilters = () => {
    const next = { ...initialFilter, project_id: projectId, fee_period_id: null, fee_type_id: null, status: '', search_text: '', page_index: 1 }
    if (workingProject?.id && workingProject.code) initialSearchKey.current = `${workingProject.id}:${workingProject.code}:all`
    operations.setPeriodId(null)
    void feeInvoices.loadData(next)
  }
  const handleCreateFee = () => {
    router.push(`/${locale}/fee-management/create`)
  }
  const confirmVisibility = (row: typeof feeInvoices.rows[number], value: boolean) => {
    if (!canOperate || operations.submitting) return
    if (!row.fee_period_id) { SwalAlert('warning', feeText(dictionary, 'fee_invoice_visibility_period_required', 'Visibility cannot be changed because this invoice has no fee period.'), 'center', false); return }
    SwalAlert('question', '', 'center', false, true, true, () => { void operations.toggleVisibility(row, value).catch(error => SwalAlert('error', error, 'center')) }, feeText(dictionary, 'confirm', 'Confirm'), { title: value ? feeText(dictionary, 'fee_invoice_show_to_resident', 'Show to resident') : feeText(dictionary, 'fee_invoice_hide_from_resident', 'Hide from resident'), cancelButtonText: feeText(dictionary, 'cancel', 'Cancel'), html: value ? feeText(dictionary, 'fee_invoice_show_to_resident_confirm', 'Show this fee invoice to residents?') : feeText(dictionary, 'fee_invoice_hide_from_resident_confirm', 'Hide this fee invoice from residents?') })
  }
  const confirmBulkAction = (action: 'visibility' | 'active', value: boolean) => {
    if (!canOperate || operations.submitting || !selectedRows.length) return
    const title = action === 'visibility'
      ? value ? feeText(dictionary, 'fee_invoice_show_to_resident', 'Show to resident') : feeText(dictionary, 'fee_invoice_hide_from_resident', 'Hide from resident')
      : value ? feeText(dictionary, 'fee_invoice_activate', 'Activate') : feeText(dictionary, 'fee_invoice_deactivate', 'Deactivate')
    SwalAlert('question', '', 'center', false, true, true, () => {
      void (async () => {
        try {
          const result = action === 'visibility' ? await operations.toggleVisibilityBulk(selectedRows, value) : await operations.toggleActiveBulk(selectedRows, value)
          setSelectedInvoiceIds(result.failedInvoiceIds)
          if (result.failedInvoiceIds.length && result.successfulInvoiceIds.length === 0) {
            SwalAlert('error', result.error ?? feeText(dictionary, 'fee_invoice_bulk_failed', 'Unable to update the selected fee invoices.'), 'center', false)
          } else if (result.failedInvoiceIds.length) {
            SwalAlert('warning', feeText(dictionary, 'fee_invoice_bulk_partial_result', `${result.successfulInvoiceIds.length} invoices were updated; ${result.failedInvoiceIds.length} could not be updated.`).replace('{success}', String(result.successfulInvoiceIds.length)).replace('{failed}', String(result.failedInvoiceIds.length)), 'center', false)
          } else {
            SwalAlert('success', feeText(dictionary, 'fee_invoice_bulk_success', 'Selected fee invoices were updated.'), 'center')
          }
        } catch (error) { SwalAlert('error', error, 'center') }
      })()
    }, feeText(dictionary, 'confirm', 'Confirm'), { title, cancelButtonText: feeText(dictionary, 'cancel', 'Cancel'), html: feeText(dictionary, 'fee_invoice_bulk_confirm', 'Apply this action to {count} selected fee invoices?').replace('{count}', String(selectedRows.length)) })
  }

  return (
    <ContentWrapper
      title={feeText(dictionary, 'fee_invoice_page_title', 'Fee Management')}
      description={feeText(dictionary, 'fee_invoice_page_subtitle', 'Search and review fee invoices by unit, customer and project.')}
      icon={<ReceiptLongIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} gap={2}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {feeText(dictionary, 'fee_invoice_list_title', 'Fee Invoices')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feeText(dictionary, 'fee_invoice_list_subtitle', 'Search and review fee invoices for the selected project.')}
            </Typography>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {canOperate && <Button variant="outlined" startIcon={<CampaignIcon />} disabled={contextSwitchPending || !projectId || !operations.periodId} onClick={() => setNotificationOpen(true)}>{feeText(dictionary, 'fee_notification_action', 'Send fee notification')}</Button>}
            {canOperate && <Button variant="outlined" startIcon={<PointOfSaleIcon />} disabled={contextSwitchPending || !projectId || !operations.periodId} onClick={() => setSettlementOpen(true)}>{feeText(dictionary, 'fee_settlement_action', 'Counter payment / settlement')}</Button>}
            {createFeePermission.resolved && createFeePermission.canAdd && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateFee}>
                {feeText(dictionary, 'fee_invoice_create_action', 'Create single fee')}
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          <FeePeriodOverviewDashboard dictionary={dictionary} locale={locale} overview={contextSwitchPending ? emptyOverview : operations.overview} loading={contextSwitchPending || operations.overviewLoading} error={null} />
          {operations.overviewError && <WorkflowErrorAlert title={feeText(dictionary, 'fee_overview_load_failed', 'Unable to load fee period overview.')} message={operations.overviewError.message} executionId={operations.overviewError.executionId} executionIdLabel={dictionary.common?.executionid ?? 'Execution ID'} workflowId={operations.overviewError.workflowId} />}
        </Stack>

        <FeeInvoiceFilterBar
          dictionary={dictionary}
          locale={locale}
          filter={feeInvoices.draftFilter}
          periods={operations.periods}
          feeTypes={feeTypes}
          paymentStatuses={paymentStatuses}
          disabled={contextSwitchPending}
          onChange={(key, value) => {
            if (key === 'fee_period_id') { changeFeePeriod(value as number | null); return }
            if (key === 'fee_type_id' || key === 'status') feeInvoices.applyAdvancedFilter(key, value as never)
            else feeInvoices.updateDraftFilter(key, value)
          }}
          onSearch={feeInvoices.handleSearch}
          onReset={resetFilters}
        />

        {feeInvoices.error && (
          <WorkflowErrorAlert
            title={feeText(dictionary, 'fee_invoice_load_failed', 'Unable to load fee invoices.')}
            message={feeInvoices.error.message}
            workflowId={feeInvoices.error.workflowId}
            workflowLabel="Workflow"
            errorCode={feeInvoices.error.errorCode}
            errorCodeLabel={dictionary.common?.errorcode ?? 'Error code'}
            executionId={feeInvoices.error.executionId}
            executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copiedLabel={locale === 'vi' ? 'Đã sao chép' : 'Copied'}
            copySuccessMessage={dictionary.common?.copiedErrorReference ?? (locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference')}
            copyFailedMessage={locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.'}
            retryLabel={commonText(dictionary, 'retry', 'Retry')}
            onRetry={() => void feeInvoices.loadData()}
          />
        )}

        <Stack spacing={1}>
          {canOperate && selectedRows.length > 0 && (
            <Paper variant="outlined" sx={{ px: 1.5, py: 1, bgcolor: 'action.hover' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{feeText(dictionary, 'fee_invoice_selected_count', '{count} invoices selected').replace('{count}', String(selectedRows.length))}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} disabled={operations.submitting} onClick={() => confirmBulkAction('visibility', true)}>{feeText(dictionary, 'fee_invoice_show_to_resident', 'Show to resident')}</Button>
                  <Button size="small" variant="outlined" startIcon={<VisibilityOffIcon />} disabled={operations.submitting} onClick={() => confirmBulkAction('visibility', false)}>{feeText(dictionary, 'fee_invoice_hide_from_resident', 'Hide from resident')}</Button>
                  <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleIcon />} disabled={operations.submitting} onClick={() => confirmBulkAction('active', true)}>{feeText(dictionary, 'fee_invoice_activate', 'Activate')}</Button>
                  <Button size="small" variant="outlined" color="warning" startIcon={<CancelIcon />} disabled={operations.submitting} onClick={() => confirmBulkAction('active', false)}>{feeText(dictionary, 'fee_invoice_deactivate', 'Deactivate')}</Button>
                </Stack>
              </Stack>
            </Paper>
          )}
          <Stack direction="row" justifyContent="flex-end">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={invoiceViewMode}
              onChange={(_, value: FeeInvoiceViewMode | null) => { if (value) setInvoiceViewMode(value) }}
              aria-label={feeText(dictionary, 'fee_invoice_view_mode', 'Invoice view mode')}
            >
              <ToggleButton value="list">{feeText(dictionary, 'fee_invoice_view_list', 'List')}</ToggleButton>
              <ToggleButton value="apartment">{feeText(dictionary, 'fee_invoice_view_by_apartment', 'By apartment')}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <FeeInvoiceTable
            dictionary={dictionary}
            locale={locale}
            rows={contextSwitchPending ? [] : feeInvoices.rows}
            apartmentGroups={contextSwitchPending ? [] : feeInvoices.apartmentGroups}
            loading={contextSwitchPending || feeInvoices.loading}
            pageSize={feeInvoices.filter.page_size}
            viewMode={invoiceViewMode}
            projectId={projectId}
            selectedInvoiceIds={selectedInvoiceIds}
            onSelectedInvoiceIdsChange={setSelectedInvoiceIds}
            onToggleVisibility={confirmVisibility}
            canOperate={canOperate}
            submitting={operations.submitting}
            paymentStatusCaptions={paymentStatusCodeList.captionMap}
          />
        </Stack>

        {feeInvoices.totalCount > 0 && (
          <PaginationPage
            page={feeInvoices.filter.page_index}
            pageSize={feeInvoices.filter.page_size}
            totalResults={feeInvoices.totalCount}
            jumpPage={feeInvoices.filter.page_index}
            handlePageSizeChange={feeInvoices.handlePageSizeChange}
            handlePageChange={feeInvoices.handlePageChange}
            handleJumpPage={feeInvoices.handleJumpPage}
            dictionary={dictionary}
          />
        )}
        <FeeNotificationDialog open={notificationOpen} onClose={() => setNotificationOpen(false)} dictionary={dictionary} locale={locale} projectId={projectId} periodId={operations.periodId} projectLabel={workingProject ? `${workingProject.code} — ${workingProject.name}` : ''} projectScope={workingProject?.code} sessiontoken={sessiontoken} periods={operations.periods} templates={operations.templates} templatesLoading={operations.templatesLoading} templatesError={operations.templatesError} onOpen={() => void operations.loadTemplates()} submitting={operations.submitting} onSubmit={operations.sendNotifications} />
        <FeeSettlementDialog open={settlementOpen} onClose={() => setSettlementOpen(false)} dictionary={dictionary} locale={locale} projectId={projectId} periodId={operations.periodId} projectLabel={workingProject ? `${workingProject.code} — ${workingProject.name}` : ''} periods={operations.periods} rows={contextSwitchPending ? [] : feeInvoices.rows} submitting={operations.submitting} onSubmit={operations.settle} />
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default FeeInvoiceManagementPage
