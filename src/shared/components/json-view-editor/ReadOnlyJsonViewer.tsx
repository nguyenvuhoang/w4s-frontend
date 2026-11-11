'use client'

import React, { useMemo, useState } from 'react'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, IconButton, NoSsr, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'

import JsonEditorComponent from '@/@core/components/jSONEditor'
import SwalAlert from '@/shared/utils/SwalAlert'

import { prepareJsonViewerContent, tokenizeJson } from './jsonViewerContent'

export type JsonViewerLabels = {
  tree: string
  json: string
  viewMode: string
  copy: string
  copySuccess: string
  copyFailed: string
}

type Props = {
  value: unknown
  labels: JsonViewerLabels
  height?: string
  sanitize?: (value: unknown) => unknown
}

const ReadOnlyJsonViewer = ({ value, labels, height = '300px', sanitize }: Props) => {
  const [mode, setMode] = useState<'tree' | 'json'>('tree')
  const content = useMemo(() => prepareJsonViewerContent(value, sanitize), [value, sanitize])
  const tokens = useMemo(() => mode === 'json' && content.isJson ? tokenizeJson(content.text) : null, [mode, content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content.text)
      SwalAlert('success', labels.copySuccess, 'top-end')
    } catch {
      SwalAlert('error', labels.copyFailed, 'top-end')
    }
  }

  return (
    <Box sx={{ height, width: '100%', minWidth: 0, maxWidth: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 0.5, gap: 1, flexShrink: 0, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          aria-label={labels.viewMode}
          onChange={(_, nextMode: 'tree' | 'json' | null) => {
            if (nextMode) setMode(nextMode)
          }}
        >
          <ToggleButton value="tree" sx={{ py: 0.25 }}>{labels.tree}</ToggleButton>
          <ToggleButton value="json" sx={{ py: 0.25 }}>{labels.json}</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={labels.copy}>
          <IconButton size="small" aria-label={labels.copy} onClick={handleCopy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        {/* Keep the editor mounted so expand/collapse and search survive mode changes. */}
        <Box hidden={mode !== 'tree'} sx={{ height: '100%', '& .jsoneditor': { border: 0 } }}>
          <NoSsr>
            <JsonEditorComponent initialJson={content.treeValue} height="100%" readOnly />
          </NoSsr>
        </Box>
        {mode === 'json' && (
          <Box
            component="pre"
            tabIndex={0}
            sx={{
              m: 0, p: 2, height: '100%', boxSizing: 'border-box', maxWidth: '100%', overflow: 'auto',
              fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre', overflowWrap: 'normal', wordBreak: 'normal',
              '& .json-key': { color: 'primary.main' },
              '& .json-string': { color: 'success.main' },
              '& .json-number': { color: 'warning.main' },
              '& .json-boolean': { color: 'info.main' },
              '& .json-null': { color: 'text.secondary' }
            }}
          >
            {tokens ? tokens.map((token, index) => <span key={index} className={`json-${token.type}`}>{token.text}</span>) : content.text}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default ReadOnlyJsonViewer
