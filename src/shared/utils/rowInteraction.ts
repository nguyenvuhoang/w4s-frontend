'use client'

import { useCallback } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'

import tableConfig from '@/configs/tableConfig'
import { useRouter } from '@shared/hooks/useRouter'

export type RowInteractionMode = 'single-click' | 'double-click' | 'none'

// Priority: explicit per-screen `mode` > system/customer `tableConfig.detailOpenMode` > 'double-click'.
// The system config itself is the thing unmigrated/legacy tables never see, so it can be changed
// per deployment without touching any table's source and without affecting a screen that opts out
// via an explicit `mode` (including 'none' for screens with no Detail at all).
export const resolveRowInteractionMode = (explicitMode?: RowInteractionMode): RowInteractionMode => (
  explicitMode ?? tableConfig.detailOpenMode
)

export type RowInteractionConfig<T> = {
  /** Omit to inherit the system-wide default (`tableConfig.detailOpenMode`, 'double-click' unless a customer changes it). */
  mode?: RowInteractionMode
  onOpenDetail?: (row: T) => void
  getDetailUrl?: (row: T) => string | null | undefined
  /** Row-level opt-out, e.g. rows without a valid id should not open detail. Defaults to always interactive. */
  isRowInteractive?: (row: T) => boolean
}

export type RowInteractionRowProps = {
  hover: boolean
  tabIndex?: number
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onDoubleClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  sx: { cursor: CSSProperties['cursor']; transition?: string }
}

// Elements/controls inside a row that must swallow the click instead of triggering navigation.
// `data-prevent-row-navigation` is the convention new call sites should use; `data-stop-row-navigation`
// is kept for compatibility with the inline implementations this module replaces.
const ROW_NAVIGATION_BLOCKED_SELECTOR = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[contenteditable="true"]',
  '[data-prevent-row-navigation]',
  '[data-stop-row-navigation]'
].join(', ')

const hasTextSelectionInRow = (row: HTMLElement) => {
  const selection = window.getSelection()

  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !selection.toString().trim()) {
    return false
  }

  return selection.getRangeAt(0).intersectsNode(row)
}

// Shared guard so a drag-to-select/copy or a click on a nested control never triggers row
// navigation, regardless of whether the table uses single-click or double-click mode.
export const shouldTriggerRowNavigation = (event: MouseEvent<HTMLElement>) => {
  const target = event.target instanceof Element ? event.target : null

  if (target?.closest(ROW_NAVIGATION_BLOCKED_SELECTOR)) return false

  return !hasTextSelectionInRow(event.currentTarget)
}

/**
 * Centralizes the click/double-click-to-open-detail behavior shared by BO list tables so it is
 * configured once (mode + hover/cursor styling + navigation safety) instead of re-implemented
 * per screen. Pass either `onOpenDetail` (caller handles navigation) or `getDetailUrl` (this hook
 * navigates via the app router).
 */
export function useRowInteraction<T>(config: RowInteractionConfig<T>) {
  const router = useRouter()
  const mode = resolveRowInteractionMode(config.mode)
  const { onOpenDetail, getDetailUrl, isRowInteractive } = config

  const navigate = useCallback((row: T) => {
    if (onOpenDetail) {
      onOpenDetail(row)
      return
    }

    const url = getDetailUrl?.(row)

    if (url) router.push(url)
  }, [onOpenDetail, getDetailUrl, router])

  const isRowClickable = useCallback((row: T) => (
    mode !== 'none' && (isRowInteractive ? isRowInteractive(row) : true)
  ), [mode, isRowInteractive])

  const getRowProps = useCallback((row: T): RowInteractionRowProps => {
    const clickable = isRowClickable(row)

    const base: RowInteractionRowProps = {
      hover: mode !== 'none',
      sx: {
        cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'background-color 0.15s ease' : undefined
      }
    }

    if (!clickable) return base

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter') navigate(row)
    }

    if (mode === 'single-click') {
      return {
        ...base,
        tabIndex: 0,
        onClick: event => { if (shouldTriggerRowNavigation(event)) navigate(row) },
        onKeyDown: handleKeyDown
      }
    }

    if (mode === 'double-click') {
      return {
        ...base,
        tabIndex: 0,
        onDoubleClick: event => { if (shouldTriggerRowNavigation(event)) navigate(row) },
        onKeyDown: handleKeyDown
      }
    }

    return base
  }, [mode, isRowClickable, navigate])

  return { mode, navigate, isRowClickable, getRowProps }
}

type RowInteractionDictionary = { common?: Record<string, string | undefined> } | null | undefined

const ROW_INTERACTION_TIP_FALLBACK = '*** Note: To view details, select the row you want to view and double-click it.'
const ROW_INTERACTION_TIP_KEY = 'row_interaction_tip_double_click'

// Single-click is the framework default and intentionally needs no instructional copy. Keeping
// the decision here means every shared table and legacy layout wrapper follows the same rule.
// `mode: 'none'` likewise has no navigation hint.
export const getRowInteractionTip = (dictionary: RowInteractionDictionary, mode: RowInteractionMode): string | null => {
  if (mode !== 'double-click') return null

  return dictionary?.common?.[ROW_INTERACTION_TIP_KEY] ?? ROW_INTERACTION_TIP_FALLBACK
}
