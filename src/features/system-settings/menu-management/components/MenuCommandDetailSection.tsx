import type { ReactNode } from 'react'

import { Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

type Props = {
  icon?: ReactNode
  title: string
  /** Draws a subtle accent border/tint — used to make the Permission/Action card stand out for
   * command (`C`) items, where that section is the most relevant one for the record. */
  highlighted?: boolean
  children: ReactNode
}

const MenuCommandDetailSection = ({ icon, title, highlighted = false, children }: Props) => {
  const theme = useTheme()

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        height: '100%',
        borderColor: highlighted ? alpha(theme.palette.info.main, 0.4) : 'divider',
        bgcolor: highlighted ? alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.08 : 0.04) : 'background.paper'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Paper>
  )
}

export default MenuCommandDetailSection
