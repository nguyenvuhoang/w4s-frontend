'use client'

import { useMemo, useState } from 'react'

import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Button, Collapse, Divider, Paper, Stack, Typography } from '@mui/material'

import type { WorkspaceBootDiagnostic, WorkspaceBootErrorCode } from '@/shared/services/workspaceBootDiagnostics'
import { buildDiagnosticReport } from '@/shared/services/workspaceBootDiagnostics'

const text = (dictionary: any, key: string, fallback: string): string => dictionary?.workspaceBoot?.[key] ?? fallback

type MessageKey =
  | 'message_connection'
  | 'message_session'
  | 'message_gateway'
  | 'message_backend'
  | 'message_project_context'
  | 'message_default'

const MESSAGE_FALLBACKS: Record<MessageKey, string> = {
  message_connection: 'The system could not be reached in time. Please check your connection and try again.',
  message_session: 'Your sign-in session could not be confirmed. Please sign in again.',
  message_gateway: 'The request could not be completed by the application gateway. Please try again or contact your administrator with the reference below.',
  message_backend: 'The system could not return your workspace information. Please try again or contact your administrator with the reference below.',
  message_project_context: 'Your account was verified, but the working project could not be prepared. Please try again.',
  message_default: 'An unexpected error occurred while preparing your workspace. Please try again.'
}

const messageKeyFor = (code: WorkspaceBootErrorCode | undefined): MessageKey => {
  switch (code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'SERVICE_UNAVAILABLE':
      return 'message_connection'
    case 'SESSION_MISSING':
    case 'AUTHENTICATION_REQUIRED':
      return 'message_session'
    case 'CLIENT_CONFIGURATION_ERROR':
    case 'CLIENT_REQUEST_FAILED':
    case 'BFF_REJECTED':
    case 'INVALID_RESPONSE':
      return 'message_gateway'
    case 'BACKEND_HTTP_ERROR':
    case 'WORKFLOW_ERROR':
    case 'MISSING_USER_CODE':
      return 'message_backend'
    case 'PROJECT_SCOPE_SYNC_FAILED':
      return 'message_project_context'
    default:
      return 'message_default'
  }
}

type Props = {
  dictionary?: any
  locale: string
  /** Null only when the store has no structured diagnostic (should not happen for ERROR, kept defensive). */
  diagnostic: WorkspaceBootDiagnostic | null
  attempt?: number
  retrying?: boolean
  onRetry: () => void
  /** Explicit, user-initiated sign-in again — never triggered automatically. */
  onSignInAgain: () => void
}

/**
 * Recovery screen for a failed dashboard workspace bootstrap. Shows a friendly message, the
 * workflow execution_id / client request id as references, environment + time, and a collapsed
 * "Technical details" panel with a sanitized copy-to-clipboard report. Never renders tokens,
 * cookies, headers, raw payloads or stack traces — only the fields of WorkspaceBootDiagnostic,
 * which are sanitized when created.
 */
const WorkspaceBootErrorState = ({
  dictionary,
  locale,
  diagnostic,
  attempt,
  retrying = false,
  onRetry,
  onSignInAgain
}: Props) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || null
  const host = typeof window !== 'undefined' ? window.location.host : null
  const path = typeof window !== 'undefined' ? window.location.pathname : null

  const occurredAt = useMemo(() => {
    if (!diagnostic?.timestamp) return null

    const date = new Date(diagnostic.timestamp)

    return Number.isNaN(date.getTime()) ? diagnostic.timestamp : date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')
  }, [diagnostic?.timestamp, locale])

  const messageKey = messageKeyFor(diagnostic?.errorCode)
  const isSessionProblem = messageKey === 'message_session'
  const canRetry = diagnostic ? diagnostic.retryable : true

  const yesNo = (value: boolean | null | undefined) =>
    value === null || value === undefined
      ? text(dictionary, 'value_unknown', 'Unknown')
      : value
        ? text(dictionary, 'value_yes', 'Yes')
        : text(dictionary, 'value_no', 'No')

  const technicalRows: Array<[string, string | number | null]> = diagnostic
    ? [
        [text(dictionary, 'field_stage', 'Stage'), `${diagnostic.stage} — ${text(dictionary, `stage_${diagnostic.stage}`, diagnostic.stage)}`],
        [text(dictionary, 'field_error_code', 'Error code'), diagnostic.errorCode],
        [text(dictionary, 'field_http_status', 'HTTP status'), diagnostic.httpStatus],
        [text(dictionary, 'field_execution_id', 'Execution ID (workflow)'), diagnostic.executionId],
        [text(dictionary, 'field_request_id', 'Client request ID'), diagnostic.requestId],
        [text(dictionary, 'field_workflow_error_code', 'Workflow error code'), diagnostic.workflowErrorCode],
        [text(dictionary, 'field_request_sent', 'Request sent'), yesNo(diagnostic.requestSent)],
        [text(dictionary, 'field_response_received', 'Response received'), yesNo(diagnostic.responseReceived)],
        [text(dictionary, 'field_retryable', 'Retryable'), yesNo(diagnostic.retryable)],
        [text(dictionary, 'field_attempt', 'Attempt'), attempt ?? null],
        [text(dictionary, 'field_host', 'Host'), host],
        [text(dictionary, 'field_message', 'Technical message'), diagnostic.message]
      ]
    : []

  const handleCopy = async () => {
    if (!diagnostic) return

    const report = buildDiagnosticReport(diagnostic, { environment, host, path, locale, attempt })

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')

      await navigator.clipboard.writeText(report)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 4, sm: 6 },
        bgcolor: 'background.default'
      }}
    >
      <Paper
        variant="outlined"
        sx={{ width: '100%', maxWidth: 560, borderRadius: 3, px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 } }}
      >
        <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'error.lightOpacity',
              flexShrink: 0
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 36 }} />
          </Box>

          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            {text(dictionary, 'title', 'Unable to initialize your workspace')}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {text(dictionary, messageKey, MESSAGE_FALLBACKS[messageKey])}
          </Typography>

          {(diagnostic?.executionId || diagnostic?.requestId) && (
            <Stack spacing={0.5} sx={{ px: 1.5, py: 1, borderRadius: 1.5, bgcolor: 'action.hover', width: '100%' }}>
              {diagnostic?.executionId && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {text(dictionary, 'error_reference', 'Error reference')}: {diagnostic.executionId}
                </Typography>
              )}
              {diagnostic?.requestId && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {text(dictionary, 'request_reference', 'Request ID')}: {diagnostic.requestId}
                </Typography>
              )}
            </Stack>
          )}

          <Typography variant="caption" color="text.secondary">
            {text(dictionary, 'environment', 'Environment')}: {environment ?? '-'} · {text(dictionary, 'occurred_at', 'Occurred at')}:{' '}
            {occurredAt ?? '-'}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1, width: { xs: '100%', sm: 'auto' } }}>
            {canRetry && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                loading={retrying}
                loadingPosition="start"
                disabled={retrying}
                onClick={() => {
                  if (!retrying) onRetry()
                }}
                sx={{ px: 4 }}
              >
                {retrying ? text(dictionary, 'retrying', 'Retrying...') : text(dictionary, 'retry', 'Retry')}
              </Button>
            )}
            {(isSessionProblem || !canRetry) && (
              <Button variant={canRetry ? 'outlined' : 'contained'} startIcon={<LoginOutlinedIcon />} onClick={onSignInAgain}>
                {text(dictionary, 'sign_in_again', 'Sign in again')}
              </Button>
            )}
          </Stack>
        </Stack>

        {diagnostic && (
          <Box sx={{ mt: 3 }}>
            <Divider />
            <Button
              fullWidth
              color="secondary"
              onClick={() => setDetailsOpen(open => !open)}
              endIcon={detailsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              aria-expanded={detailsOpen}
              sx={{ mt: 1, justifyContent: 'space-between' }}
            >
              {text(dictionary, 'technical_details', 'Technical details')}
            </Button>

            <Collapse in={detailsOpen} unmountOnExit>
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {text(dictionary, 'technical_details_hint', 'For administrators and support staff when investigating this issue.')}
                </Typography>

                <Box
                  component="dl"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, auto) 1fr' },
                    columnGap: 2,
                    rowGap: 0.75
                  }}
                >
                  {technicalRows.map(([label, value]) => (
                    <Box key={label} sx={{ display: 'contents' }}>
                      <Typography component="dt" variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      <Typography component="dd" variant="caption" sx={{ m: 0, fontFamily: 'monospace', wordBreak: 'break-word' }}>
                        {value === null || value === undefined || value === '' ? '-' : value}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button size="small" variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={() => void handleCopy()}>
                    {text(dictionary, 'copy_diagnostics', 'Copy diagnostic information')}
                  </Button>
                  {copyState !== 'idle' && (
                    <Typography variant="caption" color={copyState === 'copied' ? 'success.main' : 'error.main'} role="status">
                      {copyState === 'copied'
                        ? text(dictionary, 'copied', 'Copied')
                        : text(dictionary, 'copy_failed', 'Unable to copy. Please select and copy the details manually.')}
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Collapse>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default WorkspaceBootErrorState
