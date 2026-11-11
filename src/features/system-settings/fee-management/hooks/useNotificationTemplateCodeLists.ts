'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

export { NOTIFICATION_TEMPLATE_ALL_CHANNEL } from '../feeTemplate.constants'

export const NOTIFICATION_TEMPLATE_CODE_GROUP = 'IPS'
export const NOTIFICATION_TEMPLATE_GROUP_CODE_NAME = 'NOTIFICATION_TEMPLATE_GROUP'
export const NOTIFICATION_CHANNEL_CODE_NAME = 'NOTIFICATION_CHANNEL'
export const NOTIFICATION_TEMPLATE_STATUS_CODE_NAME = 'IPS_STATUS'

/**
 * CodeList-backed captions and select options for notification templates. Options only expose
 * visible records (and remain sorted by code_index through buildCodeListOptions); caption maps
 * retain every returned record so legacy values can still be displayed on existing templates.
 */
export function useNotificationTemplateCodeLists(language: Locale | string) {
  const groups = useCodeListCaptionMap({
    code_group: NOTIFICATION_TEMPLATE_CODE_GROUP,
    code_name: NOTIFICATION_TEMPLATE_GROUP_CODE_NAME,
    language
  })
  const channels = useCodeListCaptionMap({
    code_group: NOTIFICATION_TEMPLATE_CODE_GROUP,
    code_name: NOTIFICATION_CHANNEL_CODE_NAME,
    language
  })
  const statuses = useCodeListCaptionMap({
    code_group: NOTIFICATION_TEMPLATE_CODE_GROUP,
    code_name: NOTIFICATION_TEMPLATE_STATUS_CODE_NAME,
    language
  })

  const groupOptions = useMemo(
    () => buildCodeListOptions(groups.items.filter(item => item.visible === true), String(language)),
    [groups.items, language]
  )
  const channelOptions = useMemo(
    () => buildCodeListOptions(channels.items.filter(item => item.visible === true), String(language)),
    [channels.items, language]
  )

  return {
    groupOptions,
    channelOptions,
    groupCaptionMap: groups.captionMap,
    channelCaptionMap: channels.captionMap,
    statusCaptionMap: statuses.captionMap,
    statusLoading: statuses.isLoading,
    statusError: statuses.error,
    isLoading: groups.isLoading || channels.isLoading,
    error: groups.error ?? channels.error
  }
}

export const getNotificationTemplateCodeListCaption = (captionMap: ReadonlyMap<string, string>, value: string | null | undefined) => {
  const raw = value?.trim() ?? ''

  return raw ? captionMap.get(raw.toUpperCase()) ?? raw : '-'
}

/** IPS / IPS_STATUS caption for a template status; unknown backend values remain visible verbatim. */
export const getNotificationTemplateStatusCaption = getNotificationTemplateCodeListCaption
