'use client'

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import type { LocalizedIntegrationModule } from '../integrationModules'

type IntegrationModuleCardProps = {
  module: LocalizedIntegrationModule
  onOpen: (module: LocalizedIntegrationModule) => void
}

const IntegrationModuleCard = ({ module, onOpen }: IntegrationModuleCardProps) => {
  const theme = useTheme()
  const Icon = module.icon

  return (
    <Paper
      variant='outlined'
      onClick={() => onOpen(module)}
      sx={{
        p: 4,
        minHeight: 250,
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color', 'background-color'], {
          duration: 180
        }),
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(theme.palette.primary.main, 0.5),
          boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.03),
          '& .integration-module-icon': {
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.14)
          }
        }
      }}
    >
      <Stack spacing={3}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' gap={2}>
          <Box
            className='integration-module-icon'
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              transition: theme.transitions.create(['background-color', 'color'], { duration: 180 })
            }}
          >
            <Icon fontSize='medium' />
          </Box>

          <Chip size='small' label={module.statusLabel} variant='outlined' color={module.statusColor ?? 'warning'} />
        </Stack>

        <Box>
          <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
            {module.title}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.65 }}>
            {module.description}
          </Typography>
        </Box>
      </Stack>

      <Button
        size='small'
        variant='text'
        endIcon={<ArrowForwardRounded fontSize='small' />}
        onClick={event => {
          event.stopPropagation()
          onOpen(module)
        }}
        sx={{ alignSelf: 'flex-start', mt: 4, px: 0 }}
      >
        {module.action}
      </Button>
    </Paper>
  )
}

export default IntegrationModuleCard
