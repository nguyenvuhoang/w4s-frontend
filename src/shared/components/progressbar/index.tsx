'use client'

import type { ReactNode } from 'react'
import { ProgressProvider } from '@bprogress/react'
import { useSettings } from '@core/hooks/useSettings'

import { NavigationOverlayProvider } from './NavigationOverlay'
import { NavigationLifecycleProvider } from './NavigationLifecycleProvider'

const ProgressBarProgress = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings()

  return (
    <ProgressProvider
      height='3px'
      color={settings.primaryColor || '#225087'}
      options={{ showSpinner: false, easing: 'ease', speed: 200 }}
    >
      <NavigationLifecycleProvider>
        <NavigationOverlayProvider>{children}</NavigationOverlayProvider>
      </NavigationLifecycleProvider>
    </ProgressProvider>
  )
}

export default ProgressBarProgress
