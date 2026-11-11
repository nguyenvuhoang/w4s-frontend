'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

/** CodeList of the business apartment status (`apartment_status`), never the record status A / I. */
export const APARTMENT_STATUS_CODE_GROUP = 'IPS'
export const APARTMENT_STATUS_CODE_NAME = 'APARTMENT_STATUS'

/**
 * Apartment status options and captions from CodeList IPS / APARTMENT_STATUS (no hard-coded list):
 * options = visible items sorted by code_index (value = code_value, label = caption of the language);
 * captionMap also covers hidden items so a stored value still shows its caption.
 */
export function useApartmentStatusCodeList(language: Locale | string) {
  const { items, captionMap, isLoading, error } = useCodeListCaptionMap({
    code_group: APARTMENT_STATUS_CODE_GROUP,
    code_name: APARTMENT_STATUS_CODE_NAME,
    language
  })

  const options = useMemo(
    () => buildCodeListOptions(items.filter(item => item.visible === true), String(language)),
    [items, language]
  )

  return { options, captionMap, isLoading, error }
}

/** Caption of a stored apartment_status; the raw value when CodeList has no caption for it (legacy / not loaded); '' when empty. */
export const getApartmentStatusCaption = (captionMap: ReadonlyMap<string, string>, value: string | null | undefined) => {
  const raw = value?.trim() ?? ''

  return raw ? captionMap.get(raw.toUpperCase()) ?? raw : ''
}
