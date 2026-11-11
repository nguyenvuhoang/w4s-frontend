'use client'

import { useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { feeService } from '../service'
import type { FeeTypeItem } from '../types'

/** Loads the shared fee-type catalog once for the invoice filter. */
export function useFeeInvoiceFilterOptions({ sessiontoken, language }: { sessiontoken?: string; language: Locale | string }) {
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([])

  useEffect(() => {
    let active = true
    if (!sessiontoken) return () => { active = false }

    void feeService.simpleSearchFeeTypes({ sessiontoken, language: language as Locale, filter: { search_text: '', page_index: 1, page_size: 100 } })
      .then(response => { if (active) setFeeTypes(response.items.filter(item => item.id !== null)) })
      .catch(() => { if (active) setFeeTypes([]) })

    return () => { active = false }
  }, [language, sessiontoken])

  return { feeTypes }
}
