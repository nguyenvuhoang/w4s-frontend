'use client'

import { useContext, useEffect } from 'react'
import { Typography } from '@mui/material'
import type { BoxProps } from '@mui/material/Box'
import Box from '@mui/material/Box'
import { SettingsContext } from '@core/contexts/settingsContext'
import { navTraceLoader } from '@/shared/utils/navigationDebug'
import BrandLoadingLogo from '@components/BrandLoadingLogo'

type FallbackSpinnerProps = {
  sx?: BoxProps['sx']
  loadingtext?: string
  loadingText?: string
}

const FallbackSpinner = ({ sx, loadingtext, loadingText }: FallbackSpinnerProps) => {
  const resolvedLoadingText = loadingText || loadingtext || 'Loading, please wait...'

  useEffect(() => {
    navTraceLoader('FallbackSpinner', true)

    return () => navTraceLoader('FallbackSpinner', false)
  }, [])

  // Read the context directly instead of the throwing useSettings() hook: this component is also
  // used as a Suspense `fallback` shown WHILE <Providers> (which mounts SettingsProvider) is
  // itself still loading — at that exact moment there is no SettingsProvider ancestor yet, so it
  // must degrade gracefully to the profile's built-in logo rather than crash.
  const settingsCtx = useContext(SettingsContext)
  const loadingLogoUrl = settingsCtx?.settings?.logos?.loading

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          minWidth: 0,
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100dvh',
          px: 2,
          ...sx
        }}
      >

        {/* Branding logo from System Settings wins when configured; otherwise the profile's
            (W4S) logo — the same asset as the login screen. */}
        <BrandLoadingLogo src={loadingLogoUrl || undefined} alt={resolvedLoadingText} width={104} />

        <Typography
          sx={{
            fontSize: '14px',
            color: '#193B69',
            marginTop: 1,
            fontFamily: 'Quicksand, sans-serif',
          }}
        >
          {resolvedLoadingText}
        </Typography>
      </Box>
    </>
  )
}

export default FallbackSpinner
