'use client'

// React Imports
import { useMemo } from 'react';

// MUI Imports
import type { } from '@mui/lab/themeAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import {
  darken,
  extendTheme,
  lighten
} from '@mui/material/styles';
import type { } from '@mui/material/themeCssVarsAugmentation'; //! Do not remove this import otherwise you will get type errors while making a production build
import { deepmerge } from '@mui/utils';

// Type Imports
import type { ChildrenType, SystemMode } from '@core/types';

// Component Imports

// Config Imports
import themeConfig from '@configs/themeConfig';

// Hook Imports
import { useSettings } from '@core/hooks/useSettings';

// Core Theme Imports
import defaultCoreTheme from '@core/theme';

// Branding
import { DEFAULT_BRANDING_PALETTE } from '@shared/constants/branding';

type Props = ChildrenType & {
  systemMode: SystemMode
}

const ThemeProviderComponent = (props: Props) => {
  // Props
  const { children, systemMode } = props

  // Hooks
  const { settings } = useSettings()

  // Vars
  let currentMode: SystemMode


  currentMode = 'light'

  // Full brand color palette (System Settings > Branding > Bảng màu thương hiệu) — every
  // semantic slot maps into the MUI theme below, not just `primary`, so the whole UI (surfaces,
  // backgrounds, text) reflects the chosen palette, not only the primary accent.
  const palette = settings.palette || DEFAULT_BRANDING_PALETTE

  // Merge the palette color scheme override with the core theme
  const theme = useMemo(() => {
    const newColorScheme = {
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: palette.primary,
              light: lighten(palette.primary, 0.2),
              dark: darken(palette.primary, 0.1)
            },
            secondary: {
              main: palette.secondary,
              light: lighten(palette.secondary, 0.2),
              dark: darken(palette.secondary, 0.1)
            },
            background: {
              default: palette.background,
              paper: palette.surface
            },
            text: {
              primary: palette.text_primary,
              secondary: palette.text_secondary,
              disabled: 'rgb(128, 128, 128)'
            },
            action: {
              disabled: 'rgb(12, 45, 28)'
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
  }, [palette, settings.skin, currentMode])

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
          <GlobalStyles
            styles={{
              ':root': {
                '--brand-primary': palette.primary,
                '--brand-primary-light': lighten(palette.primary, 0.2),
                '--brand-primary-dark': darken(palette.primary, 0.1),
                '--brand-secondary': palette.secondary,
                '--brand-accent': palette.accent,
                '--brand-background': palette.background,
                '--brand-surface': palette.surface,
                '--brand-text-primary': palette.text_primary,
                '--brand-text-secondary': palette.text_secondary,
                '--primary-color': 'var(--mui-palette-primary-main)',
                '--header-bg': 'var(--mui-palette-primary-main)'
              }
            }}
          />
          {children}
        </>
      </ThemeProvider >
    </AppRouterCacheProvider>
  )
}

export default ThemeProviderComponent
