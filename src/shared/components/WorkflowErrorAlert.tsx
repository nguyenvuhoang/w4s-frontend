'use client'

import { useEffect, useRef, useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

import SwalAlert from '@/shared/utils/SwalAlert'

export type WorkflowErrorAlertProps = {
  title?: string
  message?: string
  description?: string
  workflowId?: string
  workflowLabel?: string
  errorCode?: string
  errorCodeLabel?: string
  executionId?: string
  executionIdLabel?: string
  referenceLabel?: string
  copyLabel?: string
  copiedLabel?: string
  copySuccessMessage?: string
  copyFailedMessage?: string
  retryLabel?: string
  technicalDetails?: string
  technicalDetailsLabel?: string
  allowTrace?: boolean
  traceHref?: string
  traceLabel?: string
  traceTooltip?: string
  onRetry?: () => void
  className?: string
  sx?: SxProps<Theme>
}

const ERROR_BG = '#fef2f2'
const ERROR_BORDER = '#fca5a5'
const ERROR_TEXT = '#991b1b'
const ERROR_SUBTLE_BG = '#ffffff'

const WorkflowErrorAlert = ({
  title = 'Không thể thực hiện thao tác',
  message,
  description,
  workflowId,
  workflowLabel = 'Workflow',
  errorCode,
  errorCodeLabel = 'Mã lỗi',
  executionId,
  executionIdLabel,
  referenceLabel = 'Mã tra cứu lỗi',
  copyLabel = 'Sao chép',
  copiedLabel = 'Đã sao chép',
  copySuccessMessage = 'Đã sao chép mã tra cứu',
  copyFailedMessage = 'Không thể sao chép mã tra cứu',
  retryLabel = 'Thử lại',
  technicalDetails,
  technicalDetailsLabel = 'Chi tiết kỹ thuật',
  allowTrace = false,
  traceHref,
  traceLabel = 'Truy vết lỗi',
  traceTooltip = 'Mở nhật ký ứng dụng để truy vết lỗi',
  onRetry,
  className,
  sx
}: WorkflowErrorAlertProps) => {
  const [copied, setCopied] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const detailMessage = message ?? description ?? 'Đã xảy ra lỗi. Vui lòng thử lại.'
  const resolvedExecutionIdLabel = executionIdLabel ?? referenceLabel

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const handleCopy = async () => {
    if (!executionId) return

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.')
      }

      await navigator.clipboard.writeText(executionId)
      setCopied(true)
      SwalAlert('success', copySuccessMessage, 'top-end', true, false, false, undefined, undefined, { toast: true })

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      SwalAlert('error', copyFailedMessage, 'top-end', true, false, false, undefined, undefined, { toast: true, timer: 3000 })
    }
  }

  const handleTrace = () => {
    if (traceHref) window.open(traceHref, '_blank', 'noopener,noreferrer')
  }

  return (
    <Box
      className={className}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: ERROR_BORDER,
        bgcolor: ERROR_BG,
        p: { xs: 1.5, sm: 2 },
        maxWidth: '100%',
        ...sx
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <ErrorOutlineIcon sx={{ mt: 0.25, color: ERROR_TEXT, flexShrink: 0 }} />

        <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            <Typography variant="subtitle2" sx={{ color: ERROR_TEXT, fontWeight: 800, wordBreak: 'break-word' }}>
              {title}
            </Typography>

            {onRetry && (
              <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon fontSize="small" />}
                  onClick={onRetry}
                >
                  {retryLabel}
                </Button>
              </Box>
            )}
          </Stack>

          <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
            {detailMessage}
          </Typography>

          {(workflowId || errorCode) && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {workflowId && (
                <Chip
                  size="small"
                  label={`${workflowLabel}: ${workflowId}`}
                  sx={{
                    bgcolor: '#fee2e2',
                    color: ERROR_TEXT,
                    borderRadius: 1,
                    '& .MuiChip-label': { fontWeight: 600, px: 1 }
                  }}
                />
              )}
              {errorCode && (
                <Chip
                  size="small"
                  label={`${errorCodeLabel}: ${errorCode}`}
                  sx={{
                    bgcolor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: 1,
                    '& .MuiChip-label': { fontFamily: 'monospace', fontWeight: 600, px: 1, wordBreak: 'break-all', whiteSpace: 'normal' }
                  }}
                />
              )}
            </Stack>
          )}

          {executionId && (
            <Stack spacing={0.75}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {resolvedExecutionIdLabel}
              </Typography>

              <Box
                sx={{
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: '#fecaca',
                  bgcolor: ERROR_SUBTLE_BG,
                  p: 1,
                  display: 'flex',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}
              >
                <Typography
                  component="code"
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    fontFamily: 'monospace',
                    color: ERROR_TEXT,
                    wordBreak: 'break-all'
                  }}
                >
                  {executionId}
                </Typography>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                  <Tooltip title={copied ? copiedLabel : copyLabel}>
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                        onClick={() => void handleCopy()}
                      >
                        {copied ? copiedLabel : copyLabel}
                      </Button>
                    </span>
                  </Tooltip>
                  {allowTrace && traceHref && (
                    <Tooltip title={traceTooltip}>
                      <Button
                        size="small"
                        color="inherit"
                        variant="outlined"
                        startIcon={<OpenInNewIcon fontSize="small" />}
                        onClick={handleTrace}
                      >
                        {traceLabel}
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            </Stack>
          )}

          {technicalDetails && (
            <Stack spacing={0.75}>
              <Box
                onClick={() => setDetailsOpen(open => !open)}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none' }}
              >
                <IconButton size="small" sx={{ p: 0.25 }}>
                  {detailsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {technicalDetailsLabel}
                </Typography>
              </Box>

              <Collapse in={detailsOpen}>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: ERROR_SUBTLE_BG,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: 'text.secondary',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {technicalDetails}
                </Box>
              </Collapse>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}

export default WorkflowErrorAlert
