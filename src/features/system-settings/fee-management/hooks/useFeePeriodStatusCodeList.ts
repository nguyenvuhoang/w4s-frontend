'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

export const FEE_PERIOD_STATUS_CODE_GROUP = 'IPS'
export const FEE_PERIOD_STATUS_CODE_NAME = 'FEE_PERIOD_STATUS'

/**
 * Fee period statuses from CodeList IPS / FEE_PERIOD_STATUS (no hard-coded list):
 * options = visible items sorted by code_index (value = code_value, label = caption of the language);
 * captionMap also covers hidden items so a stored status still shows its caption in the table.
 */
export function useFeePeriodStatusCodeList(language: Locale | string) {
  const { items, captionMap, isLoading, error } = useCodeListCaptionMap({
    code_group: FEE_PERIOD_STATUS_CODE_GROUP,
    code_name: FEE_PERIOD_STATUS_CODE_NAME,
    language
  })

  const options = useMemo(
    () => buildCodeListOptions(items.filter(item => item.visible === true), String(language)),
    [items, language]
  )

  return { options, captionMap, isLoading, error }
}

/** Caption of a status value; the raw value when CodeList has no caption for it; '-' when empty. */
export const getFeePeriodStatusCaption = (captionMap: ReadonlyMap<string, string>, value: string | null | undefined) => {
  const raw = value?.trim() ?? ''

  return raw ? captionMap.get(raw.toUpperCase()) ?? raw : '-'
}
