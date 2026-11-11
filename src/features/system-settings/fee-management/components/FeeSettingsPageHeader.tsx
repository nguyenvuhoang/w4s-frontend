'use client'

import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'
import type { ReactNode } from 'react'

import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  feeSettingsHref,
  feeSettingsText,
  findFeeSettingsModule,
  localizeFeeSettingsModule,
  type FeeSettingsModuleKey
} from '../feeSettingsModules'

type FeeSettingsPageHeaderProps = {
  dictionary: SystemSettingsDictionary
  locale: string
  moduleKey: FeeSettingsModuleKey
  /** Global actions (Add, Quick create...) rendered on the right of the title. */
  actions?: ReactNode
}

/** Breadcrumb + title + back link shared by the fee settings sub pages (same layout as Integrations sub pages). */
const FeeSettingsPageHeader = ({ dictionary, locale, moduleKey, actions }: FeeSettingsPageHeaderProps) => {
  const settingsModule = localizeFeeSettingsModule(findFeeSettingsModule(moduleKey), dictionary)
  const Icon = settingsModule.icon
  const hubTitle = feeSettingsText(dictionary, 'hub_title', 'Fee Management')

  return (
    <Stack spacing={1.5}>
      <Breadcrumbs sx={{ mb: 1 }}>
        <MuiLink component={NextLink} href={`/${locale}/system-settings`} underline='hover'>
          {dictionary.system_settings_modules?.breadcrumb_system_settings ?? 'System Settings'}
        </MuiLink>
        <MuiLink component={NextLink} href={feeSettingsHref(locale)} underline='hover'>
          {hubTitle}
        </MuiLink>
        <Typography color='text.primary'>{settingsModule.title}</Typography>
      </Breadcrumbs>

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3}>
        <Stack direction='row' gap={1.5} alignItems='flex-start'>
          <Icon color='primary' sx={{ fontSize: 38, mt: 0.25 }} />
          <Box sx={{ maxWidth: 820 }}>
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 1 }}>
              {settingsModule.title}
            </Typography>
            <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.65 }}>
              {settingsModule.description}
            </Typography>
          </Box>
        </Stack>

        {actions && (
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>

      <Box>
        <Button component={NextLink} href={feeSettingsHref(locale)} startIcon={<ArrowBackRounded />} sx={{ px: 0 }}>
          {feeSettingsText(dictionary, 'back_to_hub', 'Back to Fee Management')}
        </Button>
      </Box>
    </Stack>
  )
}

export default FeeSettingsPageHeader
