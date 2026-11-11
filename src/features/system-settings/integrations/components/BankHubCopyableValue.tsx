'use client'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'

import SwalAlert from '@/shared/utils/SwalAlert'

type Props = {
  value?: string | null
  /** Tooltip + aria-label of the copy button. */
  copyLabel: string
  successMessage: string
  failedMessage: string
  fontSize?: number
}

const truncateTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block'
}

/** Truncated monospace value (full value in tooltip) with an always-visible copy button. */
const BankHubCopyableValue = ({ value, copyLabel, successMessage, failedMessage, fontSize = 13 }: Props) => {
  const text = value?.trim() ?? ''

  const copyValue = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable.')

      await navigator.clipboard.writeText(text)
      SwalAlert('success', successMessage, 'top-end')
    } catch {
      SwalAlert('error', failedMessage, 'top-end')
    }
  }

  if (!text) return <Typography component="span">-</Typography>

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
      <Tooltip title={text}>
        <Typography component="span" sx={{ ...truncateTextSx, minWidth: 0, fontFamily: 'monospace', fontSize }}>
          {text}
        </Typography>
      </Tooltip>
      <Tooltip title={copyLabel}>
        <IconButton
          size="small"
          color="primary"
          aria-label={copyLabel}
          onClick={event => {
            // Keeps the click from reaching any row-level handler.
            event.stopPropagation()
            void copyValue()
          }}
          sx={{ flexShrink: 0 }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}

export default BankHubCopyableValue
