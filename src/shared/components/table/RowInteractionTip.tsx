import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'

import { getRowInteractionTip, type RowInteractionMode } from '@/shared/utils/rowInteraction'

type Props = {
  mode: RowInteractionMode
  dictionary: { common?: Record<string, string | undefined> } | null | undefined
  sx?: SxProps<Theme>
}

// Renders nothing for mode 'none' — a non-clickable table has no navigation hint to show.
const RowInteractionTip = ({ mode, dictionary, sx }: Props) => {
  const tip = getRowInteractionTip(dictionary, mode)

  if (!tip) return null

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', ...sx }}>
      <InfoOutlined sx={{ fontSize: 16 }} />
      <Typography variant="caption">{tip}</Typography>
    </Stack>
  )
}

export default RowInteractionTip
