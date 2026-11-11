'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import Backdrop from '@mui/material/Backdrop'

import PageLoadingScreen from '@components/PageLoadingScreen'
import { navTrace } from '@/shared/utils/navigationDebug'

import { usePendingNavigation } from './NavigationLifecycleProvider'

// How long a navigation must stay pending before we escalate from the (non-blocking) top
// progress bar to a full-screen, interaction-blocking overlay. Keeps fast navigations silent
// (no flicker) while still giving unmistakable feedback — and stopping repeat clicks — once a
// navigation is genuinely slow.
const OVERLAY_DELAY_MS = 800

type NavigationPendingContextValue = {
  isPending: boolean
  isOverlayActive: boolean
}

const NavigationPendingContext = createContext<NavigationPendingContextValue>({
  isPending: false,
  isOverlayActive: false
})

// Pending is owned by the navigation lifecycle, independent of progress-bar DOM/fade timers.
export const NavigationOverlayProvider = ({ children }: { children: ReactNode }) => {
  const pending = usePendingNavigation()
  const isPending = Boolean(pending?.showProgress)
  const [isOverlayActive, setIsOverlayActive] = useState(false)

  useEffect(() => {
    let overlayTimer: ReturnType<typeof setTimeout> | null = null

    const clearOverlayTimer = () => {
      if (overlayTimer) {
        clearTimeout(overlayTimer)
        overlayTimer = null
      }
    }

    if (isPending) {
      overlayTimer = setTimeout(() => setIsOverlayActive(true), OVERLAY_DELAY_MS)
    } else {
      setIsOverlayActive(false)
    }

    return clearOverlayTimer
  }, [isPending])

  useEffect(() => {
    navTrace(isOverlayActive ? 'overlay:SHOW(navigation-backdrop)' : 'overlay:hide(navigation-backdrop)', {
      pendingId: pending?.id ?? null, pendingUrl: pending?.url ?? null, pendingSource: pending?.source ?? null, owned: pending?.owned ?? null
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trace only on overlay flips
  }, [isOverlayActive])

  useEffect(() => {
    document.body.setAttribute('aria-busy', isOverlayActive ? 'true' : 'false')

    return () => { document.body.removeAttribute('aria-busy') }
  }, [isOverlayActive])

  return (
    <NavigationPendingContext.Provider value={{ isPending, isOverlayActive }}>
      {children}
      {isOverlayActive && (
        // Rendered conditionally rather than left mounted with `open={false}` — plain (non-Modal)
        // Backdrop only fades its opacity when closed, it doesn't remove itself from the DOM or
        // drop `pointer-events`, so a stale instance would keep silently swallowing every click
        // on the page forever after the first slow navigation. Mounting/unmounting it directly
        // guarantees clicks are never blocked once the navigation is done.
        <Backdrop
          open
          transitionDuration={0}
          aria-busy
          role='status'
          aria-live='polite'
          sx={{
            zIndex: theme => theme.zIndex.tooltip + 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <PageLoadingScreen sx={{ minHeight: 'auto' }} debugSource='NavigationOverlay' />
        </Backdrop>
      )}
    </NavigationPendingContext.Provider>
  )
}

// Exposed for any component that wants to react to a pending/blocking navigation (e.g. disabling
// its own local action button) without re-deriving the state itself.
export const useNavigationPending = () => useContext(NavigationPendingContext)
