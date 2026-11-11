import { Box } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import { MenuIcon } from '@/shared/components/GenerateMenu'

type Props = {
  icon: string | null
  boxSize?: number
  iconSize?: number
}

// Thin wrapper around the project's existing MenuIcon renderer (handles RemixIcon `ri-*`
// classes, MUI icon names, and image URLs, with an AppsRounded fallback when the string doesn't
// resolve to anything) — adds the rounded "chip" frame used across this detail page so an icon
// preview always looks intentional, never like a bare glyph floating in text.
const MenuCommandIconPreview = ({ icon, boxSize = 40, iconSize = 20 }: Props) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        width: boxSize,
        height: boxSize,
        borderRadius: 2,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
        color: 'primary.main'
      }}
    >
      <MenuIcon icon={icon ?? undefined} size={iconSize} color="currentColor" />
    </Box>
  )
}

export default MenuCommandIconPreview
