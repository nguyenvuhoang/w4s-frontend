'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import {
  integrationModules,
  localizeIntegrationModule,
  type LocalizedIntegrationModule
} from '../integrationModules'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

export const useIntegrationsHub = (dictionary: SystemSettingsDictionary) => {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale ?? 'vi'

  const modules = useMemo<LocalizedIntegrationModule[]>(
    () => integrationModules.map(module => localizeIntegrationModule(module, dictionary)),
    [dictionary]
  )

  const handleOpenModule = (module: LocalizedIntegrationModule) => {
    router.push(`/${locale}/system-settings/integrations/${module.key}`)
  }

  return { locale, modules, handleOpenModule }
}
