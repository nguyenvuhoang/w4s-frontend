'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import { Box, Button, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'

import type { Locale } from '@/configs/i18n'

import type { ConfigFilesDictionary } from '../types'
import {
  CONFIG_FILE_SERVICES,
  localizeConfigFileServiceModule,
  type LocalizedConfigFileServiceModule
} from '../services/configFileServices'
import { configFileText } from './configFileHelpers'

type ConfigFileServiceListContentProps = {
  dictionary: ConfigFilesDictionary
  locale: Locale
}

type ServiceCardProps = {
  module: LocalizedConfigFileServiceModule
  locale: Locale
}

const ServiceCard = ({ module, locale }: ServiceCardProps) => {
  const theme = useTheme()
  const Icon = module.icon
  const isComingSoon = module.status === 'coming-soon'
  const href = `/${locale}/system-settings/config-files/${module.key}`
  const openService = () => {
    if (isComingSoon) return

    window.location.assign(href)
  }

  return (
    <Paper
      variant='outlined'
      role={isComingSoon ? undefined : 'link'}
      tabIndex={isComingSoon ? undefined : 0}
      onClick={openService}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openService()
        }
      }}
      sx={{
        p: 4,
        minHeight: 250,
        borderRadius: 2,
        cursor: isComingSoon ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'text.primary',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        transition: theme.transitions.create(['transform', 'box-shadow', 'border-color', 'background-color'], {
          duration: 180
        }),
        '&:hover': isComingSoon
          ? {}
          : {
              transform: 'translateY(-3px)',
              borderColor: alpha(theme.palette.primary.main, 0.5),
              boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.12)}`,
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.03),
              '& .service-icon': {
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.14)
              }
            }
      }}
    >
      <Stack spacing={3}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' gap={2}>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 800, letterSpacing: 0, lineHeight: 1 }}>
              {module.code}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {module.name}
            </Typography>
          </Box>

          <Box
            className='service-icon'
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
        </Stack>

        <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.65 }}>
          {module.description}
        </Typography>
      </Stack>

      <Stack direction='row' alignItems='center' justifyContent='space-between' gap={2} sx={{ mt: 4 }}>
        {isComingSoon ? (
          <Chip size='small' label={module.statusLabel} variant='outlined' color='warning' />
        ) : (
          <Button component='span' size='small' variant='text' endIcon={<ArrowForwardRounded fontSize='small' />} sx={{ px: 0 }}>
            {module.action}
          </Button>
        )}
      </Stack>
    </Paper>
  )
}

const ConfigFileServiceListContent = ({ dictionary, locale }: ConfigFileServiceListContentProps) => {
  const modules = CONFIG_FILE_SERVICES.map(module => localizeConfigFileServiceModule(module, dictionary))

  return (
    <Stack spacing={5}>
      <Box>
        <Button href={`/${locale}/system-settings`} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
          {configFileText(dictionary, 'breadcrumb_system_settings', 'System Settings')}
        </Button>

        <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
          {configFileText(dictionary, 'config_files_service_list_title', 'System Config Files')}
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 820, lineHeight: 1.65 }}>
          {configFileText(dictionary, 'config_files_service_list_description', 'Choose a service to manage its mounted JSON configuration files.')}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {modules.map(module => (
          <Grid key={module.key} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
            <ServiceCard module={module} locale={locale} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default ConfigFileServiceListContent
