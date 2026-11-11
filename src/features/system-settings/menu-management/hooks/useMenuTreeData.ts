'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { getMenuCommandCaption } from '../components/menuCommandHelpers'
import { menuCommandService } from '../services/menuCommandService'
import type { MenuCommandItem } from '../types'

const PAGE_SIZE = 200
// Safety cap on how many pages get pulled in case total_count is ever wrong/stale — stops an
// infinite loop rather than actually being expected to hit in a real BO menu tree.
const MAX_PAGES = 25

export type MenuParentOption = {
  command_id: string
  caption: string
}

type Params = {
  sessiontoken?: string
  language: Locale
  fallbackErrorMessage: string
}

// Loads the full BO menu/command tree from WF_BO_SIMPLE_SEARCH_USER_COMMAND (the same
// workflow/service the list screen already uses) — paginating through every page so the result
// is complete, not just the first page. This single fetch backs three different needs on the
// create screen: the parent-menu picker options (command_type "M" only), the next display_order
// suggestion, and the next command_id suggestion — all derived from the same `items`, so there is
// only ever one workflow round-trip per load/reload instead of one per feature.
export const useMenuTreeData = ({ sessiontoken, language, fallbackErrorMessage }: Params) => {
  const [items, setItems] = useState<MenuCommandItem[]>([])
  const [options, setOptions] = useState<MenuParentOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<MenuCommandItem[]> => {
    setLoading(true)
    setError(null)

    try {
      const collected: MenuCommandItem[] = []
      let pageIndex = 1
      let totalCount = Number.POSITIVE_INFINITY

      while (collected.length < totalCount && pageIndex <= MAX_PAGES) {
        const result = await menuCommandService.searchUserCommands({
          sessiontoken,
          language,
          filter: { search_text: '', page_index: pageIndex, page_size: PAGE_SIZE }
        })

        if (result.items.length === 0) break

        collected.push(...result.items)
        totalCount = result.total_count
        pageIndex += 1
      }

      setItems(collected)
      setOptions(
        collected
          .filter(item => item.command_type === 'M')
          .map(item => ({ command_id: item.command_id, caption: getMenuCommandCaption(item, language) }))
      )

      return collected
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : fallbackErrorMessage)
      setItems([])
      setOptions([])

      return []
    } finally {
      setLoading(false)
    }
  }, [sessiontoken, language, fallbackErrorMessage])

  useEffect(() => {
    void load()
  }, [load])

  return { items, options, loading, error, reload: load }
}
