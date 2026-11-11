'use client'

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import { Box, Breadcrumbs, Grid, Link as MuiLink, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import SystemSettingCard from '@/views/pages/system-settings/SystemSettingCard'
import type {
  LocalizedSystemSettingsModule,
  SystemSettingsDictionary
} from '@/views/pages/system-settings/systemSettingsModules'

import { feeSettingsModules, feeSettingsText, localizeFeeSettingsModule } from '../feeSettingsModules'

type FeeSettingsHubContentProps = {
  dictionary: SystemSettingsDictionary
}

const FeeSettingsHubContent = ({ dictionary }: FeeSettingsHubContentProps) => {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale ?? 'vi'
  const modules = feeSettingsModules.map(module => localizeFeeSettingsModule(module, dictionary))

  const handleOpenModule = (module: LocalizedSystemSettingsModule) => {
    router.push(`/${locale}${module.href}`)
  }

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
            {dictionary.system_settings_modules?.breadcrumb_system_settings ?? 'System Settings'}
          </MuiLink>
          <Typography color='text.primary'>{feeSettingsText(dictionary, 'hub_title', 'Fee Management')}</Typography>
        </Breadcrumbs>

        <Stack direction='row' gap={1.5} alignItems='flex-start'>
          <ReceiptLongRounded color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
          <Box sx={{ maxWidth: 820 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              {feeSettingsText(dictionary, 'hub_title', 'Fee Management')}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.65 }}>
              {feeSettingsText(
                dictionary,
                'hub_description',
                'Set up system-wide fee types, billing periods and fee notification templates.'
              )}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Grid container spacing={4} justifyContent='center' sx={{ maxWidth: 1280 }}>
        {modules.map(module => (
          <Grid key={module.key} size={{ xs: 12, sm: 6, md: 4 }}>
            <SystemSettingCard module={module} onOpen={handleOpenModule} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default FeeSettingsHubContent
