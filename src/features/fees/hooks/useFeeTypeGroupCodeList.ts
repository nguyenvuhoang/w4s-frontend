'use client'

import { useMemo } from 'react'

import type { Locale } from '@/configs/i18n'
import { useCodeListCaptionMap } from '@/shared/hooks/useCodeListCaptionMap'
import { CodeListApiError } from '@/shared/services/codeListService'
import { buildFeeTypeCalculationMethodOptions } from './useFeeTypeCalculationMethodCodeList'

export const FEE_TYPE_GROUP_CODE_GROUP = 'IPS'
export const FEE_TYPE_GROUP_CODE_NAME = 'FEE_TYPE_GROUP'

export function useFeeTypeGroupCodeList(language: Locale | string, currentValue: string) {
  const { items, isLoading, error } = useCodeListCaptionMap({
    code_group: FEE_TYPE_GROUP_CODE_GROUP,
    code_name: FEE_TYPE_GROUP_CODE_NAME,
    language
  })
  const options = useMemo(
    () => buildFeeTypeCalculationMethodOptions(items, String(language), currentValue),
    [currentValue, items, language]
  )

  return { options, isLoading, error, executionId: error instanceof CodeListApiError ? error.executionId : undefined }
}
