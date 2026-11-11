import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { Box, Breadcrumbs, Button, Card, CardContent, CircularProgress, Link as MuiLink, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { integrationsText } from '../integrationModules'

type BankHubCallbackContentProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  /** Raw query params from the SePay redirect. Their format is not documented yet, so they are shown as-is. */
  callbackParams: Array<{ key: string; value: string }>
}

/**
 * Landing page for SePay `completion_redirect_uri`. It intentionally never declares the link
 * successful: the backend webhook / status API is the source of truth for linked accounts.
 */
const BankHubCallbackContent = ({ dictionary, locale, callbackParams }: BankHubCallbackContentProps) => {
  const integrationsHref = `/${locale}/system-settings/integrations`

  return (
    <Stack spacing={4}>
      <Breadcrumbs>
        <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
          {integrationsText(dictionary, 'breadcrumb_system_settings')}
        </MuiLink>
        <MuiLink component={NextLink} href={integrationsHref} underline='hover'>
          {integrationsText(dictionary, 'integrations_hub_title')}
        </MuiLink>
        <Typography color='text.primary'>{integrationsText(dictionary, 'bankhub_companies_title')}</Typography>
      </Breadcrumbs>

      <Card variant='outlined' sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={2} alignItems='center' sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={48} />
            <Typography variant='h5' sx={{ fontWeight: 700 }}>
              {integrationsText(dictionary, 'integrations_bankhub_callback_title')}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 560 }}>
              {integrationsText(dictionary, 'integrations_bankhub_callback_description')}
            </Typography>

            {callbackParams.length > 0 && (
              <Box sx={{ width: '100%', maxWidth: 560, textAlign: 'left', pt: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  {integrationsText(dictionary, 'integrations_bankhub_callback_params')}
                </Typography>
                <Stack
                  component='dl'
                  spacing={1}
                  sx={{ m: 0, p: 3, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
                >
                  {callbackParams.map(param => (
                    <Stack key={param.key} direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 0, sm: 2 }}>
                      <Typography component='dt' variant='body2' color='text.secondary' sx={{ minWidth: 160 }}>
                        {param.key}
                      </Typography>
                      <Typography component='dd' variant='body2' sx={{ m: 0, wordBreak: 'break-all' }}>
                        {param.value || '-'}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            <Button component={NextLink} href={integrationsHref} startIcon={<ArrowBackRounded />} sx={{ mt: 2 }}>
              {integrationsText(dictionary, 'integrations_back_to_hub')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

export default BankHubCallbackContent
