'use client'

import { useMemo, useState } from 'react'

import CheckRounded from '@mui/icons-material/CheckRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import InboxOutlined from '@mui/icons-material/InboxOutlined'
import WrapTextRounded from '@mui/icons-material/WrapTextRounded'
import {
  Box,
  Chip,
  Dialog,
  IconButton,
  NoSsr,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material'

import JsonEditorComponent from '@/@core/components/jSONEditor'

import { buildPayloadLines, formatPayloadSize, preparePayloadContent } from './payloadViewerContent'
import type { PayloadHighlight } from './payloadViewerContent'

export type PayloadViewerLabels = {
  pretty: string
  raw: string
  tree: string
  viewMode: string
  wrap: string
  copy: string
  copied: string
  copyFailed: string
  fullscreen: string
  exitFullscreen: string
  invalidJson: string
  largePayload: string
  // Supports a `{count}` placeholder.
  lines: string
}

type ViewMode = 'pretty' | 'raw' | 'tree'

type Props = {
  title?: string
  value: unknown
  labels: PayloadViewerLabels
  emptyText: string
  // Show the value as plain text even when it is valid JSON (log messages, stack traces).
  textOnly?: boolean
  // Highlight BEGIN/END/REQUEST/RESPONSE markers and error words in text content.
  highlightLogMarkers?: boolean
  sanitize?: (value: unknown) => unknown
  sanitizeText?: (value: string) => string
  // Fixed height; when omitted the viewer grows to fill a flex column parent.
  height?: number | string
  minHeight?: number | string
  defaultWrap?: boolean
}

// Above this many lines the gutter is dropped and the text is rendered as a single block.
const LINE_NUMBER_LIMIT = 10_000

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Read-only viewer for request/response/header payloads and log text. Reuses the JSON tokenizer
 * and the project JSON editor (tree mode = expand/collapse) instead of adding a new dependency.
 */
const PayloadViewer = ({
  title,
  value,
  labels,
  emptyText,
  textOnly = false,
  highlightLogMarkers = false,
  sanitize,
  sanitizeText,
  height,
  minHeight = 280,
  defaultWrap = false
}: Props) => {
  const [mode, setMode] = useState<ViewMode>('pretty')
  const [wrap, setWrap] = useState(defaultWrap)
  const [fullscreen, setFullscreen] = useState(false)
  const [copyState, setCopyState] = useState<CopyState>('idle')

  const content = useMemo(
    () => preparePayloadContent(value, { textOnly, sanitize, sanitizeText }),
    [value, textOnly, sanitize, sanitizeText]
  )

  const isJson = content.kind === 'json'
  const activeMode: ViewMode = isJson ? mode : 'pretty'
  const displayText = activeMode === 'raw' ? content.raw : content.pretty
  const highlight: PayloadHighlight = isJson ? 'json' : highlightLogMarkers ? 'log' : 'none'

  const { lines, truncatedHighlight } = useMemo(
    () => (activeMode === 'tree' ? { lines: [], truncatedHighlight: false } : buildPayloadLines(displayText, highlight)),
    [activeMode, displayText, highlight]
  )

  const sizeLabel = useMemo(() => (content.kind === 'empty' ? '' : formatPayloadSize(displayText)), [content.kind, displayText])
  const lineCount = content.kind === 'empty' ? 0 : content.pretty.split('\n').length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }

    window.setTimeout(() => setCopyState('idle'), 1500)
  }

  const copyTitle = copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : labels.copy

  const renderToolbar = (inFullscreen: boolean) => (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      sx={{ px: 1.5, py: 0.75, gap: 1, flexShrink: 0, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
    >
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
        {title && <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>}
        {content.kind !== 'empty' && (
          <>
            <Chip size="small" variant="outlined" label={isJson ? 'JSON' : 'Text'} sx={{ height: 20, fontSize: 11 }} />
            <Typography variant="caption" color="text.secondary">
              {labels.lines.replace('{count}', lineCount.toLocaleString())} · {sizeLabel}
            </Typography>
          </>
        )}
        {content.invalidJson && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<ErrorOutlineRounded />}
            label={labels.invalidJson}
            sx={{ height: 22, fontSize: 11 }}
          />
        )}
      </Stack>

      {content.kind !== 'empty' && (
        <Stack direction="row" alignItems="center" gap={0.5}>
          {isJson && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              aria-label={labels.viewMode}
              onChange={(_, nextMode: ViewMode | null) => {
                if (nextMode) setMode(nextMode)
              }}
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: 12, textTransform: 'none' } }}
            >
              <ToggleButton value="pretty">{labels.pretty}</ToggleButton>
              <ToggleButton value="raw">{labels.raw}</ToggleButton>
              <ToggleButton value="tree">{labels.tree}</ToggleButton>
            </ToggleButtonGroup>
          )}
          {activeMode !== 'tree' && (
            <Tooltip title={labels.wrap}>
              <IconButton
                size="small"
                aria-label={labels.wrap}
                aria-pressed={wrap}
                color={wrap ? 'primary' : 'default'}
                onClick={() => setWrap(current => !current)}
              >
                <WrapTextRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={copyTitle}>
            <IconButton size="small" aria-label={labels.copy} onClick={handleCopy}>
              {copyState === 'copied'
                ? <CheckRounded fontSize="small" color="success" />
                : <ContentCopyRounded fontSize="small" color={copyState === 'failed' ? 'error' : 'inherit'} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={inFullscreen ? labels.exitFullscreen : labels.fullscreen}>
            <IconButton
              size="small"
              aria-label={inFullscreen ? labels.exitFullscreen : labels.fullscreen}
              onClick={() => setFullscreen(!inFullscreen)}
            >
              {inFullscreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  )

  const renderLines = () => {
    const showGutter = lines.length <= LINE_NUMBER_LIMIT

    return (
      <Box
        component="pre"
        tabIndex={0}
        sx={{
          m: 0,
          py: 1.5,
          minWidth: wrap ? 0 : 'max-content',
          width: wrap ? '100%' : undefined,
          boxSizing: 'border-box',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'text.primary',
          outline: 'none',
          '& .pv-row': { display: 'flex' },
          '& .pv-ln': {
            position: 'sticky',
            left: 0,
            flexShrink: 0,
            width: `${String(lines.length).length + 2}ch`,
            pr: 1.5,
            textAlign: 'right',
            color: 'text.disabled',
            bgcolor: 'background.paper',
            userSelect: 'none'
          },
          '& .pv-lc, & .pv-block': {
            flex: 1,
            minWidth: 0,
            pl: showGutter ? 1 : 2,
            pr: 2,
            whiteSpace: wrap ? 'pre-wrap' : 'pre',
            overflowWrap: wrap ? 'anywhere' : 'normal'
          },
          '& .pv-row:hover': { bgcolor: 'action.hover' },
          '& .t-key': { color: 'primary.main' },
          '& .t-string': { color: 'success.main' },
          '& .t-number': { color: 'warning.main' },
          '& .t-boolean': { color: 'info.main' },
          '& .t-null': { color: 'text.secondary', fontStyle: 'italic' },
          '& .t-marker': { color: 'primary.main', fontWeight: 700, bgcolor: 'action.selected', borderRadius: 0.5, px: 0.25 },
          '& .t-danger': { color: 'error.main', fontWeight: 700 }
        }}
      >
        {showGutter
          ? lines.map((line, lineIndex) => (
              <span key={lineIndex} className="pv-row">
                <span className="pv-ln">{lineIndex + 1}</span>
                <span className="pv-lc">
                  {line.map((token, tokenIndex) => (
                    token.type === 'plain'
                      ? token.text
                      : <span key={tokenIndex} className={`t-${token.type}`}>{token.text}</span>
                  ))}
                </span>
              </span>
            ))
          : <span className="pv-block">{displayText}</span>}
      </Box>
    )
  }

  const renderBody = () => {
    if (content.kind === 'empty') {
      return (
        <Stack alignItems="center" justifyContent="center" gap={1} sx={{ height: '100%', py: 6, color: 'text.secondary' }}>
          <InboxOutlined sx={{ fontSize: 40, opacity: 0.6 }} />
          <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
        </Stack>
      )
    }

    if (activeMode === 'tree') {
      return (
        <Box sx={{ height: '100%', '& .jsoneditor': { border: 0 } }}>
          <NoSsr>
            <JsonEditorComponent initialJson={content.value as object} height="100%" readOnly />
          </NoSsr>
        </Box>
      )
    }

    return renderLines()
  }

  const renderFrame = (inFullscreen: boolean) => (
    <>
      {renderToolbar(inFullscreen)}
      {truncatedHighlight && (
        <Typography variant="caption" color="warning.main" sx={{ px: 1.5, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
          {labels.largePayload}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: activeMode === 'tree' ? 'hidden' : 'auto', bgcolor: 'background.paper' }}>
        {renderBody()}
      </Box>
    </>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height,
        flex: height === undefined ? 1 : undefined,
        minHeight,
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1
      }}
    >
      {!fullscreen && renderFrame(false)}

      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        slotProps={{ paper: { sx: { display: 'flex', flexDirection: 'column' } } }}
      >
        {fullscreen && renderFrame(true)}
      </Dialog>
    </Box>
  )
}

export default PayloadViewer
