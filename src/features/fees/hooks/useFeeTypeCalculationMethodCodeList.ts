'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { CodeListApiError } from '@/shared/services/codeListService'
import type { CodeListItem } from '@/shared/types/codeList'
import { buildCodeListOptions, type CodeListOption } from '@/shared/utils/buildCodeListOptions'
import { parseMultilingualCaption } from '@/shared/utils/parseMultilingualCaption'

export const FEE_TYPE_CALCULATION_METHOD_CODE_GROUP = 'IPS'
export const FEE_TYPE_CALCULATION_METHOD_CODE_NAME = 'FEE_CALCULATION_METHOD'

const codeValue = (item: CodeListItem) => item.code_value?.trim() || item.code_id.trim()

/**
 * Builds visible CodeList options while preserving a stored, removed or hidden backend value
 * as an explicit fallback option. The fallback is never substituted or sent back as a caption.
 */
export const buildFeeTypeCalculationMethodOptions = (
  items: CodeListItem[],
  locale: string,
  currentValue: string
): CodeListOption[] => {
  const options = buildCodeListOptions(items.filter(item => item.visible === true), locale)
  const raw = currentValue.trim()

  if (!raw || options.some(option => option.value === raw)) return options

  const storedItem = items.find(item => codeValue(item) === raw)
  const label = storedItem
    ? parseMultilingualCaption(storedItem.m_caption, locale) || storedItem.caption?.trim() || raw
    : raw

  return [{ value: raw, label }, ...options]
}

export function useFeeTypeCalculationMethodCodeList(language: Locale | string, currentValue: string) {
  const { items, isLoading, error } = useCodeListCaptionMap({
    code_group: FEE_TYPE_CALCULATION_METHOD_CODE_GROUP,
    code_name: FEE_TYPE_CALCULATION_METHOD_CODE_NAME,
    language
  })

  const options = useMemo(
    () => buildFeeTypeCalculationMethodOptions(items, String(language), currentValue),
    [currentValue, items, language]
  )

  return {
    options,
    isLoading,
    error,
    executionId: error instanceof CodeListApiError ? error.executionId : undefined
  }
}
