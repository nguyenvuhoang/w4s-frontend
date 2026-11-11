'use client'

import { useEffect, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { codeListService } from '@/shared/services/codeListService'
import type { CodeListItem } from '@/shared/types/codeList'
import { parseMultilingualCaption } from '@/shared/utils/parseMultilingualCaption'

export type UseCodeListCaptionMapResult = {
  items: CodeListItem[]
  captionMap: ReadonlyMap<string, string>
  isLoading: boolean
  error: Error | null
}

export const useCodeListCaptionMap = ({
  code_group,
  code_name,
  language
}: {
  code_group: string
  code_name: string
  language: Locale | string
}): UseCodeListCaptionMapResult => {
  const [items, setItems] = useState<CodeListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    setIsLoading(true)
    setError(null)

    codeListService.getByGroupAndName({ code_group, code_name, language })
      .then(result => {
        if (!active) return
        setItems(result)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setItems([])
        setError(err instanceof Error ? err : new Error('Unable to load code list.'))
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [code_group, code_name, language])

  const captionMap = useMemo(() => {
    const map = new Map<string, string>()

    items.forEach(item => {
      const caption =
        parseMultilingualCaption(item.m_caption, language) ||
        item.caption?.trim() ||
        item.code_value?.trim() ||
        item.code_id?.trim()

      if (!caption) return

      const codeId = item.code_id?.trim().toUpperCase()
      const codeValue = item.code_value?.trim().toUpperCase()

      if (codeId) {
        map.set(codeId, caption)
      }

      if (codeValue) {
        map.set(codeValue, caption)
      }
    })

    return map
  }, [items, language])

  return { items, captionMap, isLoading, error }
}
