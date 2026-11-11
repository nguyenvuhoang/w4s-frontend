import type { ReactNode } from 'react'

import { Box, Typography } from '@mui/material'

type Props = {
  label: string
  value?: ReactNode
  mono?: boolean
  children?: ReactNode
}

// Standard label-on-top / value-below field used across every detail card on this page — the
// label stays small and muted so the value (not the caption) is what the eye lands on first.
const MenuCommandInfoItem = ({ label, value, mono = false, children }: Props) => {
  const isEmpty = value === undefined || value === null || value === ''

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem', mb: 0.5 }}
      >
        {label}
      </Typography>
      <Box sx={{ minHeight: 26, display: 'flex', alignItems: 'center' }}>
        {children ?? (
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              fontFamily: mono ? 'monospace' : undefined,
              color: isEmpty ? 'text.disabled' : 'text.primary'
            }}
          >
            {isEmpty ? '—' : value}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default MenuCommandInfoItem
