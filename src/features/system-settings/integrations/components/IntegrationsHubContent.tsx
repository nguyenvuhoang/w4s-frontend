'use client'

import HubRounded from '@mui/icons-material/HubRounded'
import { Box, Breadcrumbs, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'
import { useIntegrationsHub } from '../hooks/useIntegrationsHub'
import IntegrationModuleCard from './IntegrationModuleCard'

type IntegrationsHubContentProps = {
  dictionary: SystemSettingsDictionary
}

const IntegrationsHubContent = ({ dictionary }: IntegrationsHubContentProps) => {
  const { locale, modules, handleOpenModule } = useIntegrationsHub(dictionary)

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {integrationsText(dictionary, 'breadcrumb_system_settings')}
          </MuiLink>
          <Typography color='text.primary'>{integrationsText(dictionary, 'integrations_hub_title')}</Typography>
        </Breadcrumbs>

        <Stack direction='row' gap={1.5} alignItems='flex-start'>
          <HubRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
          <Box sx={{ maxWidth: 820 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              {integrationsText(dictionary, 'integrations_hub_title')}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.65 }}>
              {integrationsText(dictionary, 'integrations_hub_description')}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Grid container spacing={4}>
        {modules.map(module => (
          <Grid key={module.key} size={{ xs: 12, sm: 6, lg: 4 }}>
            <IntegrationModuleCard module={module} onOpen={handleOpenModule} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default IntegrationsHubContent
