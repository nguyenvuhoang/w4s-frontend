'use client'

import { useEffect } from 'react'

import useVerticalNav from '@menu/hooks/useVerticalNav'

import { SIDEBAR_COLLAPSE_STORAGE_KEY } from './sidebarConstants'

const parseStoredCollapsed = (value: string | null): boolean | null => {
  if (value === 'true') return true
  if (value === 'false') return false

  return null
}

const useSidebarCollapse = (defaultCollapsed = false) => {
  const { isCollapsed, isBreakpointReached, collapseVerticalNav } = useVerticalNav()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isBreakpointReached) {
      return
    }

    const storedValue = parseStoredCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY))

    collapseVerticalNav(storedValue ?? defaultCollapsed)
  }, [collapseVerticalNav, defaultCollapsed, isBreakpointReached])

  useEffect(() => {
    if (typeof window === 'undefined' || isBreakpointReached || typeof isCollapsed !== 'boolean') return

    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(isCollapsed))
  }, [isBreakpointReached, isCollapsed])

  const toggleSidebar = () => collapseVerticalNav(typeof isCollapsed === 'boolean' ? !isCollapsed : true)

  return {
    collapsed: Boolean(isCollapsed),
    isReady: typeof isCollapsed === 'boolean',
    toggleSidebar,
    setCollapsed: collapseVerticalNav
  }
}

export default useSidebarCollapse
