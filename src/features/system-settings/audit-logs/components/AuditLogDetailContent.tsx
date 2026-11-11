'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
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
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import type { WorkflowInfo, WorkflowStepInfoList } from '@/shared/types/systemTypes'

import type { AuditLogDetailResponse, AuditLogsDictionary, AuditLogsPageProps } from '../types'
import {
  auditLogText,
  formatAuditLogBoolean,
  formatAuditLogDateTime,
  formatAuditLogDuration,
  getAuditLogStatusMeta,
  toAuditLogListPath
} from './auditLogHelpers'
import AuditLogJsonBlock from './AuditLogJsonBlock'

type Props = AuditLogsPageProps & {
  executionId: string
  initialData: AuditLogDetailResponse
  initialError?: string | null
  loading?: boolean
}

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const getDisplayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

const getStepStatusMeta = (status: unknown, locale: string) => {
  const normalized = String(status ?? '').trim()
  const upper = normalized.toUpperCase()

  if (['2', 'SUCCESS', 'COMPLETED', 'COMPLETE', 'DONE', 'OK'].includes(upper)) {
    return { label: auditLogText(locale, 'Thành công', 'Success'), color: 'success' as const }
  }

  if (['3', 'FAILED', 'FAIL', 'ERROR'].includes(upper)) {
    return { label: auditLogText(locale, 'Thất bại', 'Failed'), color: 'error' as const }
  }

  return { label: normalized || '-', color: normalized ? 'warning' as const : 'default' as const, variant: 'outlined' as const }
}

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <Grid size={{ xs: 12, md: 6, lg: 4 }}>
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  </Grid>
)

const SummaryCard = ({ workflowInfo, locale }: { workflowInfo: WorkflowInfo; locale: string }) => {
  const statusMeta = getAuditLogStatusMeta(workflowInfo.status, locale)

  return (
    <Card>
      <CardHeader title={auditLogText(locale, 'Thông tin workflow', 'Workflow Summary')} />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <SummaryItem label="Execution ID" value={getDisplayValue(workflowInfo.execution_id)} />
          <SummaryItem label="Correlation ID" value={getDisplayValue(workflowInfo.correlation_id)} />
          <SummaryItem label="Workflow ID" value={getDisplayValue(workflowInfo.workflow_id)} />
          <SummaryItem
            label="Status"
            value={<Chip size="small" color={statusMeta.color} variant={statusMeta.variant} label={statusMeta.label} />}
          />
          <SummaryItem label="Created On" value={formatAuditLogDateTime(workflowInfo.created_on, locale)} />
          <SummaryItem label="Finish On" value={formatAuditLogDateTime(workflowInfo.finish_on, locale)} />
          <SummaryItem label="Duration" value={formatAuditLogDuration(workflowInfo.created_on, workflowInfo.finish_on)} />
          <SummaryItem label="Transaction Date" value={getDisplayValue(workflowInfo.transaction_date)} />
          <SummaryItem label="Value Date" value={getDisplayValue(workflowInfo.value_date)} />
          <SummaryItem label="Workflow Type" value={getDisplayValue(workflowInfo.workflow_type)} />
          <SummaryItem label="Is Success" value={formatAuditLogBoolean(workflowInfo.is_success, locale)} />
          <SummaryItem label="Is Timeout" value={formatAuditLogBoolean(workflowInfo.is_timeout, locale)} />
          <SummaryItem label="Is Processing" value={formatAuditLogBoolean(workflowInfo.is_processing, locale)} />
          <SummaryItem label="Reversed Execution ID" value={getDisplayValue(workflowInfo.reversed_execution_id)} />
          <SummaryItem label="Reversed By Execution ID" value={getDisplayValue(workflowInfo.reversed_by_execution_id)} />
          <SummaryItem label="Approved Execution ID" value={getDisplayValue(workflowInfo.approved_execution_id)} />
          <SummaryItem label="Transaction Number" value={getDisplayValue(workflowInfo.transaction_number)} />
          <SummaryItem label="Archiving Time" value={getDisplayValue(workflowInfo.archiving_time)} />
          <SummaryItem label="Purging Time" value={getDisplayValue(workflowInfo.purging_time)} />
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Error
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                p: 2,
                borderRadius: 1,
                bgcolor: workflowInfo.error ? 'error.lighter' : 'action.hover',
                border: 1,
                borderColor: workflowInfo.error ? 'error.light' : 'divider',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              <Typography variant="body2">{getDisplayValue(workflowInfo.error)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const RequestResponseSection = ({ workflowInfo, locale, dictionary }: { workflowInfo: WorkflowInfo; locale: string; dictionary: AuditLogsDictionary }) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, lg: 6 }}>
      <Card>
        <CardHeader title={auditLogText(locale, 'Request / Input', 'Request / Input')} />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            <AuditLogJsonBlock title="input" value={workflowInfo.input} dictionary={dictionary} />
            <AuditLogJsonBlock title="input_string" value={workflowInfo.input_string} dictionary={dictionary} />
          </Stack>
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, lg: 6 }}>
      <Card>
        <CardHeader title={auditLogText(locale, 'Response Content', 'Response Content')} />
        <Divider />
        <CardContent>
          <AuditLogJsonBlock value={workflowInfo.response_content} dictionary={dictionary} />
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

const StepStatusChip = ({ status, locale }: { status: unknown; locale: string }) => {
  const meta = getStepStatusMeta(status, locale)

  return <Chip size="small" color={meta.color} variant={meta.variant} label={meta.label} />
}

const StepDetailPanel = ({ step, locale, dictionary }: { step: WorkflowStepInfoList; locale: string; dictionary: AuditLogsDictionary }) => (
  <Accordion disableGutters sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {auditLogText(locale, 'Chi tiết step', 'Step Details')}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Grid container spacing={3}>
        <SummaryItem label="Step Execution ID" value={getDisplayValue(step.step_execution_id)} />
        <SummaryItem label="Execution ID" value={getDisplayValue(step.execution_id)} />
        <SummaryItem label="Workflow ID" value={getDisplayValue((step as any).workflow_id)} />
        <SummaryItem label="Is Success" value={formatAuditLogBoolean(step.is_success, locale)} />
        <SummaryItem label="Is Timeout" value={formatAuditLogBoolean(step.is_timeout, locale)} />
        <Grid size={{ xs: 12 }}>
          <AuditLogJsonBlock title="sending_condition" value={step.sending_condition} dictionary={dictionary} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AuditLogJsonBlock title="p1_request" value={step.p1_request} dictionary={dictionary} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AuditLogJsonBlock title="p1_content" value={step.p1_content} dictionary={dictionary} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AuditLogJsonBlock title="p2_request" value={step.p2_request} dictionary={dictionary} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AuditLogJsonBlock title="p2_content" value={step.p2_content} dictionary={dictionary} />
        </Grid>
      </Grid>
    </AccordionDetails>
  </Accordion>
)

const WorkflowStepsSection = ({ steps, locale, dictionary }: { steps: WorkflowStepInfoList[]; locale: string; dictionary: AuditLogsDictionary }) => (
  <Card>
    <CardHeader title={auditLogText(locale, 'Workflow Steps', 'Workflow Steps')} />
    <Divider />
    <CardContent>
      {steps.length === 0 ? (
        <Typography variant="subtitle1" sx={{ py: 4, textAlign: 'center', fontWeight: 800 }}>
          {auditLogText(locale, 'Không có step log', 'No workflow steps found')}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ minWidth: 1180 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headerCellSx}>Step Order</TableCell>
                <TableCell sx={headerCellSx}>Step Code</TableCell>
                <TableCell sx={headerCellSx}>Execution Service</TableCell>
                <TableCell sx={headerCellSx}>P1 Status</TableCell>
                <TableCell sx={headerCellSx}>P1 Duration</TableCell>
                <TableCell sx={headerCellSx}>P2 Status</TableCell>
                <TableCell sx={headerCellSx}>P2 Duration</TableCell>
                <TableCell sx={headerCellSx}>Should Await</TableCell>
                <TableCell sx={headerCellSx}>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {steps.map((step, index) => {
                const errorText = getDisplayValue(step.p1_error ?? step.p2_error)

                return (
                  <Fragment key={step.step_execution_id || `${step.step_code}-${index}`}>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{getDisplayValue(step.step_order)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{getDisplayValue(step.step_code)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{getDisplayValue(step.execution_service)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}><StepStatusChip status={step.p1_status} locale={locale} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogDuration(step.p1_start || null, step.p1_finish || null)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}><StepStatusChip status={step.p2_status} locale={locale} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogDuration(step.p2_start || null, step.p2_finish || null)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatAuditLogBoolean(step.should_await, locale)}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Tooltip title={errorText === '-' ? '' : errorText} arrow>
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {errorText}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={9} sx={{ px: 1, py: 1.5, borderBottom: 0 }}>
                        <StepDetailPanel step={step} locale={locale} dictionary={dictionary} />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  </Card>
)

const LoadingState = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={180} />
    <Skeleton variant="rounded" height={260} />
    <Skeleton variant="rounded" height={260} />
  </Stack>
)

const AuditLogDetailContent = ({ locale, dictionary, executionId, initialData, initialError = null, loading = false }: Props) => {
  const workflowInfo = initialData.workflow_info

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
        <Stack spacing={1}>
          <Button component={Link} href={toAuditLogListPath(locale)} startIcon={<ArrowBackRounded />} sx={{ alignSelf: 'flex-start' }}>
            {auditLogText(locale, 'Quay lại', 'Back')}
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {auditLogText(locale, 'Chi tiết nhật ký hệ thống', 'Audit Log Detail')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {executionId}
          </Typography>
        </Stack>
      </Stack>

      {loading ? (
        <LoadingState />
      ) : initialError ? (
        <Alert severity="error">{initialError}</Alert>
      ) : !workflowInfo ? (
        <Alert severity="info">
          {auditLogText(locale, 'Không tìm thấy thông tin workflow cho execution id này.', 'No workflow information was found for this execution id.')}
        </Alert>
      ) : (
        <>
          <SummaryCard workflowInfo={workflowInfo} locale={locale} />
          <RequestResponseSection workflowInfo={workflowInfo} locale={locale} dictionary={dictionary} />
          <WorkflowStepsSection steps={initialData.workflow_step_info_list} locale={locale} dictionary={dictionary} />
        </>
      )}
    </Stack>
  )
}

export default AuditLogDetailContent
