'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import CheckRounded from '@mui/icons-material/CheckRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import DnsOutlined from '@mui/icons-material/DnsOutlined'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import {
  Box,
  ButtonBase,
  Chip,
  Dialog,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

import PayloadViewer from '@/shared/components/json-view-editor/PayloadViewer'
import type { PayloadViewerLabels } from '@/shared/components/json-view-editor/PayloadViewer'

import type { ApplicationLogItem, ApplicationLogsDictionary } from '../types'
import {
  formatApplicationLogDateTime,
  formatApplicationLogDuration,
  getApplicationLogDirectionMeta,
  getApplicationLogLevelMeta
} from './applicationLogHelpers'
import {
  buildApplicationLogCopyText,
  extractApplicationLogRequestMeta,
  hasApplicationLogPayload,
  isBlankApplicationLogValue
} from './applicationLogDetailHelpers'
import { maskSensitiveText, maskSensitiveValue } from './sensitiveDataMasking'

type Props = {
  locale: string
  dictionary: ApplicationLogsDictionary
  open: boolean
  item: ApplicationLogItem | null
  onClose: () => void
}

type TabKey = 'overview' | 'message' | 'headers' | 'request' | 'response'

const TAB_KEYS: TabKey[] = ['overview', 'message', 'headers', 'request', 'response']

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

type Labels = Record<string, string>

type CopyButtonProps = { getText: () => string; labels: Labels; size?: 'small' | 'medium'; idleTitle?: string }

const CopyButton = ({ getText, labels, size = 'small', idleTitle }: CopyButtonProps) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText())
      setState('copied')
    } catch {
      setState('failed')
    }

    window.setTimeout(() => setState('idle'), 1500)
  }

  const title = state === 'copied' ? labels.copied : state === 'failed' ? labels.copy_failed : idleTitle ?? labels.copy_value

  return (
    <Tooltip title={title}>
      <IconButton size={size} aria-label={labels.copy_value} onClick={handleCopy} sx={size === 'small' ? { p: 0.25 } : undefined}>
        {state === 'copied'
          ? <CheckRounded fontSize="small" color="success" />
          : <ContentCopyRounded fontSize="small" color={state === 'failed' ? 'error' : 'inherit'} />}
      </IconButton>
    </Tooltip>
  )
}

const MetaChip = ({ label, value, mono, copyable, labels }: { label: string; value: string; mono?: boolean; copyable?: boolean; labels: Labels }) => (
  <Stack
    direction="row"
    alignItems="center"
    gap={0.75}
    sx={{ px: 1, py: 0.25, minWidth: 0, maxWidth: '100%', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.default' }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      title={value}
      sx={{ fontWeight: 600, fontFamily: mono ? MONO_FONT : undefined, fontSize: mono ? 12.5 : undefined, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {value}
    </Typography>
    {copyable && <CopyButton getText={() => value} labels={labels} />}
  </Stack>
)

const InfoField = ({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
      {label}
    </Typography>
    <Typography component="div" variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: mono ? MONO_FONT : undefined }}>
      {children}
    </Typography>
  </Grid>
)

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: 1.5 }}>
    <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.5, fontWeight: 700 }}>
      {title}
    </Typography>
    {children}
  </Paper>
)

type MetaEntry = { key: string; label: string; value: string | null; mono?: boolean; copyable?: boolean }

const displayValue = (value: unknown) => (isBlankApplicationLogValue(value) ? '-' : String(value))

type BodyProps = {
  locale: string
  item: ApplicationLogItem
  labels: Labels
  fullscreen: boolean
  canToggleFullscreen: boolean
  onToggleFullscreen: () => void
  onClose: () => void
}

const ApplicationLogDetailBody = ({ locale, item, labels, fullscreen, canToggleFullscreen, onToggleFullscreen, onClose }: BodyProps) => {
  const [tab, setTab] = useState<TabKey>('overview')
  // Panels mount on first visit and then stay mounted, so switching tabs keeps viewer state.
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['overview']))

  const levelMeta = getApplicationLogLevelMeta(item.log_level, locale)
  const directionMeta = getApplicationLogDirectionMeta(item.direction, locale)
  const requestMeta = useMemo(() => extractApplicationLogRequestMeta(item.properties), [item.properties])
  const timestamp = formatApplicationLogDateTime(item.log_timestamp, locale)
  const endpoint = [requestMeta.method, requestMeta.endpoint].filter(Boolean).join(' ') || null
  const duration = item.duration === null || item.duration === undefined ? null : formatApplicationLogDuration(item.duration)

  const availability = useMemo(() => ({
    message: !isBlankApplicationLogValue(item.message),
    exception: hasApplicationLogPayload(item.exception_details),
    headers: hasApplicationLogPayload(item.headers),
    request: hasApplicationLogPayload(item.request),
    response: hasApplicationLogPayload(item.response),
    properties: hasApplicationLogPayload(item.properties)
  }), [item])

  const viewerLabels = useMemo<PayloadViewerLabels>(() => ({
    pretty: labels.viewer_pretty,
    raw: labels.viewer_raw,
    tree: labels.viewer_tree,
    viewMode: labels.viewer_mode,
    wrap: labels.viewer_wrap,
    copy: labels.copy_value,
    copied: labels.copied,
    copyFailed: labels.copy_failed,
    fullscreen: labels.fullscreen,
    exitFullscreen: labels.exit_fullscreen,
    invalidJson: labels.viewer_invalid_json,
    largePayload: labels.viewer_large_payload,
    lines: labels.viewer_lines
  }), [labels])

  // Only fields the log really carries are shown in the header strip.
  const metadata = ([
    { key: 'service', label: labels.field_service, value: item.service_name },
    { key: 'protocol', label: labels.field_protocol, value: requestMeta.protocol },
    { key: 'endpoint', label: labels.field_endpoint, value: endpoint, mono: true },
    { key: 'action', label: labels.field_action, value: item.action_name },
    { key: 'duration', label: labels.field_duration, value: duration },
    { key: 'trace', label: labels.field_trace_id, value: item.correlation_id, mono: true, copyable: true },
    { key: 'execution', label: labels.field_execution_id, value: item.execution_id, mono: true, copyable: true }
  ] as MetaEntry[]).filter((entry): entry is MetaEntry & { value: string } => !isBlankApplicationLogValue(entry.value))

  const tabLabels: Record<TabKey, string> = {
    overview: labels.tab_overview,
    message: labels.tab_message,
    headers: labels.tab_headers,
    request: labels.tab_request,
    response: labels.tab_response
  }

  const tabDot: Partial<Record<TabKey, 'success.main' | 'error.main' | 'action.disabled'>> = {
    message: availability.exception ? 'error.main' : availability.message ? 'success.main' : 'action.disabled',
    headers: availability.headers ? 'success.main' : 'action.disabled',
    request: availability.request ? 'success.main' : 'action.disabled',
    response: availability.response ? 'success.main' : 'action.disabled'
  }

  const selectTab = (next: TabKey) => {
    setTab(next)
    setVisited(current => (current.has(next) ? current : new Set(current).add(next)))
  }

  const maskedNote = (
    <Stack direction="row" alignItems="center" gap={0.75} sx={{ color: 'text.secondary', flexShrink: 0 }}>
      <ShieldOutlined sx={{ fontSize: 16 }} />
      <Typography variant="caption">{labels.masked_note}</Typography>
    </Stack>
  )

  const renderPayloadPanel = (title: string, value: unknown, emptyText: string) => (
    <>
      {maskedNote}
      <PayloadViewer
        title={title}
        value={value}
        labels={viewerLabels}
        emptyText={emptyText}
        sanitize={maskSensitiveValue}
        sanitizeText={maskSensitiveText}
        minHeight={320}
      />
    </>
  )

  const payloadRows: { key: TabKey; label: string; available: boolean }[] = [
    { key: 'message', label: labels.message_title, available: availability.message },
    { key: 'message', label: labels.stack_trace_title, available: availability.exception },
    { key: 'headers', label: labels.tab_headers, available: availability.headers },
    { key: 'request', label: labels.tab_request, available: availability.request },
    { key: 'response', label: labels.tab_response, available: availability.response }
  ]

  const renderPanel = (key: TabKey) => {
    if (key === 'overview') {
      return (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <SectionCard title={labels.section_general}>
                <Grid container spacing={2}>
                  <InfoField label={labels.field_timestamp}>{timestamp}</InfoField>
                  <InfoField label={labels.field_level}>
                    <Chip size="small" color={levelMeta.color} label={levelMeta.label} />
                  </InfoField>
                  <InfoField label={labels.field_service}>{displayValue(item.service_name)}</InfoField>
                  <InfoField label={labels.field_log_type}>{displayValue(item.log_type)}</InfoField>
                  <InfoField label={labels.field_direction}>{directionMeta.label}</InfoField>
                  <InfoField label={labels.field_flow}>{displayValue(item.flow)}</InfoField>
                  <InfoField label={labels.field_action}>{displayValue(item.action_name)}</InfoField>
                  <InfoField label={labels.field_duration}>{duration ?? '-'}</InfoField>
                </Grid>
              </SectionCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Stack gap={2} sx={{ height: '100%' }}>
                <SectionCard title={labels.section_trace}>
                  <Grid container spacing={2}>
                    <InfoField label={labels.field_trace_id} mono>{displayValue(item.correlation_id)}</InfoField>
                    <InfoField label={labels.field_execution_id} mono>{displayValue(item.execution_id)}</InfoField>
                    <InfoField label={labels.field_log_id} mono>{displayValue(item.id)}</InfoField>
                    {requestMeta.protocol && <InfoField label={labels.field_protocol}>{requestMeta.protocol}</InfoField>}
                    {endpoint && <InfoField label={labels.field_endpoint} mono>{endpoint}</InfoField>}
                  </Grid>
                </SectionCard>
                <SectionCard title={labels.section_payloads}>
                  <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                    {payloadRows.map(row => (
                      <ButtonBase
                        key={row.label}
                        onClick={() => selectTab(row.key)}
                        sx={{ justifyContent: 'space-between', py: 0.75, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <Typography variant="body2">{row.label}</Typography>
                        <Chip
                          size="small"
                          variant={row.available ? 'filled' : 'outlined'}
                          color={row.available ? 'success' : 'default'}
                          label={row.available ? labels.payload_available : labels.payload_missing}
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      </ButtonBase>
                    ))}
                  </Stack>
                </SectionCard>
              </Stack>
            </Grid>
          </Grid>
          {availability.properties && (
            <PayloadViewer
              title={labels.section_properties}
              value={item.properties}
              labels={viewerLabels}
              emptyText={labels.empty_properties}
              sanitize={maskSensitiveValue}
              sanitizeText={maskSensitiveText}
              height={340}
            />
          )}
        </>
      )
    }

    if (key === 'message') {
      return (
        <>
          <PayloadViewer
            title={labels.message_title}
            value={item.message}
            labels={viewerLabels}
            emptyText={labels.empty_message}
            textOnly
            highlightLogMarkers
            defaultWrap
            sanitizeText={maskSensitiveText}
            minHeight={availability.message ? 280 : 0}
            height={availability.message ? undefined : 'auto'}
          />
          <PayloadViewer
            title={labels.stack_trace_title}
            value={item.exception_details}
            labels={viewerLabels}
            emptyText={labels.empty_stack_trace}
            textOnly={typeof item.exception_details === 'string'}
            highlightLogMarkers
            defaultWrap
            sanitize={maskSensitiveValue}
            sanitizeText={maskSensitiveText}
            minHeight={availability.exception ? 280 : 0}
            height={availability.exception ? undefined : 'auto'}
          />
        </>
      )
    }

    if (key === 'headers') return renderPayloadPanel(labels.tab_headers, item.headers, labels.empty_headers)
    if (key === 'request') return renderPayloadPanel(labels.tab_request, item.request, labels.empty_request)

    return renderPayloadPanel(labels.tab_response, item.response, labels.empty_response)
  }

  return (
    <>
      <Box sx={{ flexShrink: 0, px: { xs: 2, md: 3 }, pt: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <Stack gap={0.75} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Typography id="application-log-detail-title" variant="h6" sx={{ fontWeight: 800 }}>
                {labels.detail_title}
              </Typography>
              <Chip size="small" color={levelMeta.color} label={levelMeta.label} sx={{ fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap" sx={{ color: 'text.secondary' }}>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <ScheduleRounded sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontFamily: MONO_FONT, fontSize: 13 }}>{timestamp}</Typography>
              </Stack>
              {item.service_name && (
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <DnsOutlined sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{item.service_name}</Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
            <CopyButton getText={() => buildApplicationLogCopyText(item)} labels={labels} size="medium" idleTitle={labels.copy_log} />
            {canToggleFullscreen && (
              <Tooltip title={fullscreen ? labels.exit_fullscreen : labels.fullscreen}>
                <IconButton aria-label={fullscreen ? labels.exit_fullscreen : labels.fullscreen} onClick={onToggleFullscreen}>
                  {fullscreen ? <FullscreenExitRounded /> : <FullscreenRounded />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={labels.close}>
              <IconButton aria-label={labels.close} onClick={onClose}>
                <CloseRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {metadata.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
            {metadata.map(entry => (
              <MetaChip key={entry.key} label={entry.label} value={entry.value} mono={entry.mono} copyable={entry.copyable} labels={labels} />
            ))}
          </Stack>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, next: TabKey) => selectTab(next)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ flexShrink: 0, px: { xs: 1, md: 2 }, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        {TAB_KEYS.map(key => (
          <Tab
            key={key}
            value={key}
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
            label={(
              <Stack direction="row" alignItems="center" gap={0.75}>
                {tabLabels[key]}
                {tabDot[key] && <Box component="span" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tabDot[key] }} />}
              </Stack>
            )}
          />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', p: { xs: 1.5, md: 2.5 }, bgcolor: 'background.default' }}>
        {TAB_KEYS.filter(key => visited.has(key)).map(key => (
          <Box
            key={key}
            role="tabpanel"
            sx={{ display: tab === key ? 'flex' : 'none', flexDirection: 'column', gap: 2, flex: '1 0 auto', minWidth: 0 }}
          >
            {renderPanel(key)}
          </Box>
        ))}
      </Box>
    </>
  )
}

const ApplicationLogDetailDialog = ({ locale, dictionary, open, item, onClose }: Props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [fullscreen, setFullscreen] = useState(false)
  const labels: Labels = dictionary.application_logs
  const isFullScreen = fullscreen || isMobile

  return (
    <Dialog
      open={open && Boolean(item)}
      // Log inspection is read-heavy: an accidental backdrop click must not close it (Esc still does).
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') onClose()
      }}
      fullScreen={isFullScreen}
      maxWidth={false}
      aria-labelledby="application-log-detail-title"
      slotProps={{
        paper: {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...(isFullScreen ? {} : { width: '92vw', maxWidth: 1500, height: '90vh', maxHeight: '90vh', m: 2 })
          }
        }
      }}
    >
      {item && (
        <ApplicationLogDetailBody
          // Remount per log so tab/view state from a previous log never leaks into the next one.
          key={item.id}
          locale={locale}
          item={item}
          labels={labels}
          fullscreen={isFullScreen}
          canToggleFullscreen={!isMobile}
          onToggleFullscreen={() => setFullscreen(current => !current)}
          onClose={onClose}
        />
      )}
    </Dialog>
  )
}

export default ApplicationLogDetailDialog
