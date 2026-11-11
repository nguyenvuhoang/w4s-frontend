import type { SvgIconComponent } from '@mui/icons-material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ConstructionRounded from '@mui/icons-material/ConstructionRounded'
import { Box, Breadcrumbs, Button, Card, CardContent, Link as MuiLink, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'

type IntegrationModulePlaceholderProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  title: string
  description: string
  icon: SvgIconComponent
}

const IntegrationModulePlaceholder = ({
  dictionary,
  locale,
  title,
  description,
  icon: Icon
}: IntegrationModulePlaceholderProps) => {
  const hubHref = `/${locale}/system-settings`
  const integrationsHref = `/${locale}/system-settings/integrations`

  return (
    <Stack spacing={4}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={hubHref} underline='hover'>
            {integrationsText(dictionary, 'breadcrumb_system_settings')}
          </MuiLink>
          <MuiLink component={NextLink} href={integrationsHref} underline='hover'>
            {integrationsText(dictionary, 'integrations_hub_title')}
          </MuiLink>
          <Typography color='text.primary'>{title}</Typography>
        </Breadcrumbs>

        <Stack direction='row' gap={1.5} alignItems='flex-start'>
          <Icon color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.65 }}>
              {description}
            </Typography>
          </Box>
        </Stack>

        <Box>
          <Button component={NextLink} href={integrationsHref} startIcon={<ArrowBackRounded />} sx={{ px: 0 }}>
            {integrationsText(dictionary, 'integrations_back_to_hub')}
          </Button>
        </Box>
      </Stack>

      <Card variant='outlined' sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={2} alignItems='center' sx={{ py: 8, textAlign: 'center' }}>
            <ConstructionRounded color='warning' sx={{ fontSize: 56 }} />
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {integrationsText(dictionary, 'integrations_placeholder_title')}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 520 }}>
              {integrationsText(dictionary, 'integrations_placeholder_description')}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default IntegrationModulePlaceholder
