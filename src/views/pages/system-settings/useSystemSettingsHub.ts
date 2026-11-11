'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@shared/hooks/useRouter'

import {
  localizeSystemSettingsGroupTitle,
  localizeSystemSettingsModule,
  systemSettingsGroups,
  systemSettingsModules,
  type LocalizedSystemSettingsModule,
  type SystemSettingsDictionary,
  type SystemSettingsGroupKey
} from './systemSettingsModules'

const normalizeSearchText = (value: string) => value.toLowerCase().trim()

export type LocalizedSystemSettingsGroup = {
  key: SystemSettingsGroupKey
  title: string
  modules: LocalizedSystemSettingsModule[]
}

export const useSystemSettingsHub = (dictionary: SystemSettingsDictionary) => {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale ?? 'vi'
  const [searchValue, setSearchValue] = useState('')

  const filteredModules = useMemo(() => {
    const keyword = normalizeSearchText(searchValue)
    const localizedModules = systemSettingsModules.map(module => localizeSystemSettingsModule(module, dictionary))

    if (!keyword) return localizedModules

    return localizedModules.filter(module => {
      const searchableText = normalizeSearchText(`${module.title} ${module.description} ${module.action}`)

      return searchableText.includes(keyword)
    })
  }, [dictionary, searchValue])

  // Search runs across every group first (filteredModules above), then modules are bucketed back
  // into their group. A group with zero matches is dropped entirely instead of rendering an empty
  // heading.
  const groupedModules = useMemo<LocalizedSystemSettingsGroup[]>(() => (
    systemSettingsGroups
      .map(group => ({
        key: group.key,
        title: localizeSystemSettingsGroupTitle(group, dictionary),
        modules: filteredModules.filter(module => module.group === group.key)
      }))
      .filter(group => group.modules.length > 0)
  ), [filteredModules, dictionary])

  const handleOpenModule = (module: LocalizedSystemSettingsModule) => {
    const hrefWithoutLocale = module.href.replace(/^\/(vi|en|la)(?=\/)/, '')
    const normalizedHref = hrefWithoutLocale.startsWith('/') ? hrefWithoutLocale : `/${hrefWithoutLocale}`

    router.push(`/${locale}${normalizedHref}`)
  }

  return {
    searchValue,
    setSearchValue,
    groups: groupedModules,
    totalModules: systemSettingsModules.length,
    handleOpenModule
  }
}
