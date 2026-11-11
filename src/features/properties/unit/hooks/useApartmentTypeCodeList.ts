'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { buildCodeListOptions } from '@/shared/utils/buildCodeListOptions'

export const APARTMENT_TYPE_CODE_GROUP = 'IPS'
export const APARTMENT_TYPE_CODE_NAME = 'APARTMENT_TYPE'

/**
 * Apartment type options and captions from CodeList IPS / APARTMENT_TYPE.
 * Only visible records can be selected; captions for hidden legacy values remain available for display.
 */
export function useApartmentTypeCodeList(language: Locale | string) {
  const { items, captionMap, isLoading, error } = useCodeListCaptionMap({
    code_group: APARTMENT_TYPE_CODE_GROUP,
    code_name: APARTMENT_TYPE_CODE_NAME,
    language
  })

  const options = useMemo(
    () => buildCodeListOptions(
      items.filter(item => item.visible === true && Boolean(item.code_value?.trim())),
      String(language)
    ),
    [items, language]
  )

  return { options, captionMap, isLoading, error }
}

/** Caption for a stored apartment type; retains the raw code for an unknown legacy value. */
export const getApartmentTypeCaption = (captionMap: ReadonlyMap<string, string>, value: string | null | undefined) => {
  const raw = value?.trim() ?? ''

  return raw ? captionMap.get(raw.toUpperCase()) ?? raw : ''
}
