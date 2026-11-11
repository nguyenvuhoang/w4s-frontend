import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ConstructionRounded from '@mui/icons-material/ConstructionRounded'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import SystemCodesContent from '@/features/system-settings/system-codes/components/SystemCodesContent'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getBrandingSettings } from '@/shared/services/brandingSettingsService'
import SystemSettingsClient from '@/views/pages/system-settings/SystemSettingsClient'
import {
  localizeSystemSettingsModule,
  systemSettingsModules,
  type SystemSettingsDictionary
} from '@/views/pages/system-settings/systemSettingsModules'

type SystemSettingsModulePageProps = {
  params: Promise<{
    locale: string
    module: string
  }>
}

const configurableModules = new Set(['branding', 'colors-typography'])

const pageText = (dictionary: SystemSettingsDictionary, key: string) => (
  dictionary.system_settings_modules?.[key] ?? key
)

const SystemSettingsModulePage = async ({ params }: SystemSettingsModulePageProps) => {
  const { locale, module: moduleKey } = await params
  const language = locale as Locale
  const settingsModule = systemSettingsModules.find(item => item.key === moduleKey)
  const dictionary = await getDictionary(language)
  const localizedModule = settingsModule ? localizeSystemSettingsModule(settingsModule, dictionary) : null
  const hubHref = `/${locale}/system-settings`

  if (settingsModule?.key === 'general') {
    const session = await auth()

    return (
      <Box sx={{ p: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Button href={hubHref} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
              {pageText(dictionary, 'breadcrumb_system_settings')}
            </Button>
          </Box>

          <SystemCodesContent dictionary={dictionary} session={session} locale={language} />
        </Stack>
      </Box>
    )
  }

  if (settingsModule && localizedModule && configurableModules.has(settingsModule.key)) {
    const brandingSettings = await getBrandingSettings()

    return (
      <Box sx={{ p: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Button href={hubHref} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
              {pageText(dictionary, 'breadcrumb_system_settings')}
            </Button>
            <Typography variant='h4' sx={{ fontWeight: 700 }}>
              {localizedModule.title}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {localizedModule.description}
            </Typography>
          </Box>

          <SystemSettingsClient serverSettings={brandingSettings} dictionary={dictionary} />
        </Stack>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Stack spacing={4}>
        <Box>
          <Button href={hubHref} startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>
            {pageText(dictionary, 'breadcrumb_system_settings')}
          </Button>
          <Typography variant='h4' sx={{ fontWeight: 700 }}>
            {localizedModule?.title ?? pageText(dictionary, 'unknown_module_title')}
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            {localizedModule?.description ?? pageText(dictionary, 'unknown_module_description')}
          </Typography>
        </Box>

        <Card variant='outlined' sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2} alignItems='center' sx={{ py: 8, textAlign: 'center' }}>
              <ConstructionRounded color='warning' sx={{ fontSize: 56 }} />
              <Typography variant='h5' sx={{ fontWeight: 700 }}>
                {pageText(dictionary, 'coming_soon_title')}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 520 }}>
                {pageText(dictionary, 'coming_soon_description')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}

export default SystemSettingsModulePage
