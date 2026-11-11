'use client'

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'

import { navTraceLoader } from '@/shared/utils/navigationDebug'
import BrandLoadingLogo from '@components/BrandLoadingLogo'

// How long this screen stays mounted before its message escalates to acknowledge the wait —
// shared in spirit with NavigationOverlay's escalation threshold (both exist to reassure the
// user a genuinely slow load is still working, not stuck).
const LONG_RUNNING_DELAY_MS = 15000

const copy: Record<string, { normal: string; longRunning: string }> = {
  vi: {
    normal: 'Đang tải dữ liệu...',
    longRunning: 'Đang mất nhiều thời gian hơn bình thường. Vui lòng chờ...'
  },
  en: {
    normal: 'Loading data...',
    longRunning: 'This is taking longer than usual. Please wait...'
  }
}

type PageLoadingScreenProps = {
  sx?: SxProps<Theme>
  /** Temporary navigation-debug label identifying which surface rendered this loader. */
  debugSource?: string
}

/**
 * Small, quiet, W4S-branded (pulsing logo) loading state shared by every "the page itself isn't ready yet"
 * surface — the (dashboard) layout's top-level Suspense fallback (auth/session bootstrap) and
 * loading.tsx (F5/direct URL/server navigation), and NavigationOverlay (client-side navigation
 * blocking overlay) — so all three read as the same one screen instead of a different spinner
 * each. Deliberately not FallbackSpinner/SyncOverlay: those are the bigger, branded/animated
 * treatments used elsewhere (login, full app boot); this one stays small and quiet since it can
 * appear very often (every route transition slower than ~800ms).
 */
const PageLoadingScreen = ({ sx, debugSource = 'PageLoadingScreen' }: PageLoadingScreenProps) => {
  const [isLongRunning, setIsLongRunning] = useState(false)
  const { locale } = useParams()

  useEffect(() => {
    navTraceLoader(debugSource, true)

    return () => navTraceLoader(debugSource, false)
  }, [debugSource])

  useEffect(() => {
    const timer = setTimeout(() => setIsLongRunning(true), LONG_RUNNING_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  const text = copy[locale as string] ?? copy.vi

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: '100dvh',
        px: 2,
        ...sx
      }}
    >
      <BrandLoadingLogo width={96} />
      <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', fontFamily: 'Quicksand' }}>
        {isLongRunning ? text.longRunning : text.normal}
      </Typography>
    </Box>
  )
}

export default PageLoadingScreen
