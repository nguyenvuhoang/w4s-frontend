'use client'

import { Fragment, useState } from 'react'
import { useRouter } from '@shared/hooks/useRouter'

import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded'
import {
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  IconButton,
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

import type { Locale } from '@/configs/i18n'
import { useSearchTableRowConfig } from '@/shared/components/table'

import { useWorkflowStepsCache } from '../hooks/useWorkflowStepsCache'
import type { WorkflowItem, WorkflowsDictionary } from '../types'
import { formatWorkflowNumber, getBooleanLabel, getWorkflowStatusMeta, workflowText } from './workflowHelpers'

type Props = {
  dictionary: WorkflowsDictionary
  locale: string
  rows: WorkflowItem[]
  loading: boolean
  pageSize: number
}

const columnCount = 9

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const stepHeaderCellSx = {
  bgcolor: 'action.hover',
  fontWeight: 700,
  whiteSpace: 'nowrap'
}

const emptyText = (value: string) => value.trim() || '-'

const WorkflowsTable = ({ dictionary, locale, rows, loading, pageSize }: Props) => {
  const router = useRouter()
  const [expandedRows, setExpandedRows] = useState<ReadonlySet<string>>(new Set())
  const { getEntry, fetchSteps, ensureLoaded } = useWorkflowStepsCache({ dictionary, language: locale as Locale })

  const toggleRow = (workflowId: string) => {
    const isCurrentlyExpanded = expandedRows.has(workflowId)

    setExpandedRows(current => {
      const next = new Set(current)

      if (isCurrentlyExpanded) {
        next.delete(workflowId)
      } else {
        next.add(workflowId)
      }

      return next
    })

    if (!isCurrentlyExpanded) {
      ensureLoaded(workflowId)
    }
  }

  const table = useSearchTableRowConfig<WorkflowItem>({
    rowInteraction: {
      onOpenDetail: row => router.push(`/${locale}/system-settings/workflows/${encodeURIComponent(row.def.workflow_id)}`),
      isRowInteractive: row => Boolean(row.def.workflow_id.trim())
    }
  })

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, width: 48 }} />
              <TableCell sx={headerCellSx}>{workflowText(dictionary, 'field_workflow_id', 'Workflow Code')}</TableCell>
              <TableCell sx={headerCellSx}>{workflowText(dictionary, 'field_workflow_name', 'Workflow Name')}</TableCell>
              <TableCell sx={headerCellSx}>{workflowText(dictionary, 'field_description', 'Description')}</TableCell>
              <TableCell sx={headerCellSx}>{workflowText(dictionary, 'field_channel_id', 'Channel')}</TableCell>
              <TableCell sx={headerCellSx} align="right">{workflowText(dictionary, 'field_timeout', 'Timeout')}</TableCell>
              <TableCell sx={headerCellSx} align="center">{workflowText(dictionary, 'field_is_reverse', 'Reversible')}</TableCell>
              <TableCell sx={headerCellSx} align="center">{workflowText(dictionary, 'field_status', 'Status')}</TableCell>
              <TableCell sx={headerCellSx} align="center">{workflowText(dictionary, 'field_step_count', 'Steps')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}><Skeleton height={28} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {workflowText(dictionary, 'empty_title', 'No workflows found.')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : rows.map((row, index) => {
              const rowKey = row.def.workflow_id || `workflow-${index}`
              const isExpanded = expandedRows.has(rowKey)
              const statusMeta = getWorkflowStatusMeta(row.def.status, dictionary)
              const stepsEntry = getEntry(rowKey)

              return (
                <Fragment key={rowKey}>
                  <TableRow {...table.getRowProps(row)}>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label={rowKey}
                        onClick={() => toggleRow(rowKey)}
                      >
                        {isExpanded ? <KeyboardArrowDownRounded fontSize="small" /> : <KeyboardArrowRightRounded fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160, fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {emptyText(row.def.workflow_id)}
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, fontWeight: 700 }}>
                      {emptyText(row.def.workflow_name)}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Tooltip title={row.def.description || ''} placement="top" arrow>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {emptyText(row.def.description)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                      {emptyText(row.def.channel_id)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {formatWorkflowNumber(row.def.timeout, locale)}
                    </TableCell>
                    <TableCell align="center">
                      {getBooleanLabel(row.def.is_reverse, dictionary)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={statusMeta.color} variant={statusMeta.variant} label={statusMeta.label} />
                    </TableCell>
                    <TableCell align="center">
                      {stepsEntry.status === 'loaded' ? formatWorkflowNumber(stepsEntry.steps.length, locale) : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={columnCount} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: { xs: 1, md: 4 } }}>
                          {stepsEntry.status === 'loading' && (
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                              <CircularProgress size={18} />
                              <Typography variant="body2" color="text.secondary">
                                {workflowText(dictionary, 'steps_loading', 'Loading processing steps...')}
                              </Typography>
                            </Stack>
                          )}

                          {stepsEntry.status === 'error' && (
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                              <Typography variant="body2" color="error.main">
                                {stepsEntry.errorMessage || workflowText(dictionary, 'steps_load_failed', 'Unable to load processing steps.')}
                              </Typography>
                              <Button size="small" onClick={() => fetchSteps(rowKey)}>
                                {workflowText(dictionary, 'retry', 'Retry')}
                              </Button>
                            </Stack>
                          )}

                          {stepsEntry.status === 'loaded' && stepsEntry.steps.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                              {workflowText(dictionary, 'steps_empty', 'This workflow has no processing steps.')}
                            </Typography>
                          )}

                          {stepsEntry.status === 'loaded' && stepsEntry.steps.length > 0 && (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ ...stepHeaderCellSx, width: 90 }} align="center">
                                    {workflowText(dictionary, 'field_step_order', 'Order')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx}>
                                    {workflowText(dictionary, 'field_step_code', 'Step Code')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx}>
                                    {workflowText(dictionary, 'field_service_id', 'Service')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx}>
                                    {workflowText(dictionary, 'field_step_description', 'Description')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx}>
                                    {workflowText(dictionary, 'field_processing_number', 'Processing Type')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx} align="right">
                                    {workflowText(dictionary, 'field_step_timeout', 'Timeout')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx} align="center">
                                    {workflowText(dictionary, 'field_should_await_step', 'Await Result')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx} align="center">
                                    {workflowText(dictionary, 'field_step_is_reverse', 'Reversible')}
                                  </TableCell>
                                  <TableCell sx={stepHeaderCellSx} align="center">
                                    {workflowText(dictionary, 'field_step_status', 'Status')}
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {stepsEntry.steps.map(step => {
                                  const stepStatusMeta = getWorkflowStatusMeta(step.status, dictionary)

                                  return (
                                    <TableRow key={`${rowKey}-${step.step_order}-${step.step_code}`}>
                                      <TableCell align="center">{formatWorkflowNumber(step.step_order, locale)}</TableCell>
                                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {emptyText(step.step_code)}
                                      </TableCell>
                                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{emptyText(step.service_id)}</TableCell>
                                      <TableCell sx={{ maxWidth: 280 }}>
                                        <Tooltip title={step.description || ''} placement="top" arrow>
                                          <Typography
                                            variant="body2"
                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                          >
                                            {emptyText(step.description)}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{emptyText(step.processing_number)}</TableCell>
                                      <TableCell align="right">{formatWorkflowNumber(step.step_timeout, locale)}</TableCell>
                                      <TableCell align="center">{getBooleanLabel(step.should_await_step, dictionary)}</TableCell>
                                      <TableCell align="center">{getBooleanLabel(step.is_reverse, dictionary)}</TableCell>
                                      <TableCell align="center">
                                        <Chip size="small" color={stepStatusMeta.color} variant={stepStatusMeta.variant} label={stepStatusMeta.label} />
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default WorkflowsTable
