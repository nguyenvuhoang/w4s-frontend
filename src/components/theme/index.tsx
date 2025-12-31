'use client'

// React Imports
import { useMemo } from 'react';

// MUI Imports
import type { } from '@mui/lab/themeAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import {
  darken,
  extendTheme,
  lighten
} from '@mui/material/styles';
import type { } from '@mui/material/themeCssVarsAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build
import { deepmerge } from '@mui/utils';

// Third-party Imports
import { useMedia } from 'react-use';

// Type Imports
import type { ChildrenType, SystemMode } from '@core/types';

// Component Imports

// Config Imports
import themeConfig from '@configs/themeConfig';

// Hook Imports
import { useSettings } from '@core/hooks/useSettings';

// Core Theme Imports
import defaultCoreTheme from '@core/theme';

type Props = ChildrenType & {
  systemMode: SystemMode
}

const ThemeProviderComponent = (props: Props) => {
  // Props
  const { children, systemMode } = props

  // Hooks
  const { settings } = useSettings()
  const isDark = useMedia('(prefers-color-scheme: dark)', systemMode === 'dark')

  // Vars
  const isServer = typeof window === 'undefined'
  let currentMode: SystemMode


  currentMode = 'light'

  // Merge the primary color scheme override with the core theme
  const theme = useMemo(() => {
    const newColorScheme = {
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: settings.primaryColor,
              light: lighten(settings.primaryColor as string, 0.2),
              dark: darken(settings.primaryColor as string, 0.1)
            },
            action: {
              disabled: 'rgb(12, 45, 28)' 
            },
            text: {
              disabled: 'rgb(128, 128, 128)'
            }
          }
        },
      },
      cssVariables: {
        colorSchemeSelector: 'class',
      },
    }

    const coreTheme = deepmerge(defaultCoreTheme(settings, currentMode), newColorScheme,)

    return extendTheme(coreTheme)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.primaryColor, settings.skin, currentMode])

  return (
    <AppRouterCacheProvider
      options={{
        prepend: true
      }}
    >
      <ThemeProvider
        theme={theme}
        defaultMode={systemMode}
        modeStorageKey={`${themeConfig.templateName.toLowerCase().split(' ').join('-')}-mui-template-mode`}
      >
        <>
          <CssBaseline />
          {children}
        </>
      </ThemeProvider >
    </AppRouterCacheProvider>
  )
}

export default ThemeProviderComponent
