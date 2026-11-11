'use client'

import { useEffect } from 'react'

// Ported from jits-admin (components/app/InspectGuard.tsx).
// Client-side deterrent only: it cannot actually prevent DevTools from being opened
// (browser menu, Mac shortcuts handled by the browser, extensions, etc.).

const DEVTOOLS_KEYS = new Set(['i', 'j', 'c'])
const DEVTOOLS_CODES = new Set(['KeyI', 'KeyJ', 'KeyC'])

function isDevToolsKey(event: KeyboardEvent) {
  return DEVTOOLS_KEYS.has(event.key?.toLowerCase()) || DEVTOOLS_CODES.has(event.code)
}

function isInspectShortcut(event: KeyboardEvent) {
  if (event.key === 'F12') return true

  // Windows/Linux: Ctrl+Shift+I / J / C
  if (event.ctrlKey && event.shiftKey && !event.altKey && isDevToolsKey(event)) return true

  // macOS: Cmd+Option+I / J / C
  if (event.metaKey && event.altKey && isDevToolsKey(event)) return true

  // Ctrl+U (view source) is intentionally NOT blocked like jits-admin does,
  // because it is the Underline shortcut in CKEditor / rich text inputs.
  return false
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
}

const InspectGuard = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_INSPECT_GUARD === 'false') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isInspectShortcut(event)) return

      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const handleContextMenu = (event: MouseEvent) => {
      // Keep native context menu on inputs/editors so right-click paste & spellcheck still work.
      if (isEditableTarget(event.target)) return

      event.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('contextmenu', handleContextMenu, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [])

  return null
}

export default InspectGuard
