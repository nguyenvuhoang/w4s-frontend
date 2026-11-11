'use client'

import { createContext, ReactNode, useMemo, useState } from "react";
import type { Mode, Skin, Layout, LayoutComponentWidth } from '@core/types'

// Hook Imports
import { useObjectCookie } from '@core/hooks/useObjectCookie'
import themeConfig from "@/configs/themeConfig";
import primaryColorConfig from "@/configs/primaryColorConfig";
import { env } from "@/env.mjs";
import {
    DEFAULT_BRANDING_LOGOS,
    DEFAULT_BRANDING_PALETTE,
    type BrandingLogos,
    type BrandingPalette,
    type BrandingSettings
} from '@shared/constants/branding'


export type Settings = {
    mode?: Mode
    skin?: Skin
    semiDark?: boolean
    layout?: Layout
    navbarContentWidth?: LayoutComponentWidth
    contentWidth?: LayoutComponentWidth
    footerContentWidth?: LayoutComponentWidth
    /** Kept in sync with palette.primary for lightweight consumers that only need one accent
     * color (top-loading bar, feature tour) — ThemeProvider itself reads the full `palette`. */
    primaryColor?: string
    /** Full coordinated brand color palette — see src/shared/constants/branding.ts. */
    palette?: BrandingPalette
    /** All 5 branding logo slots (banner/top_menu/favicon/loading/login_title) — see
     * src/shared/constants/branding.ts. */
    logos?: BrandingLogos
    fontFamily?: string
    brandingName?: string
}

type UpdateSettingsOptions = {
    updateCookie?: boolean
}
type SettingsContextProps = {
    settings: Settings
    updateSettings: (settings: Partial<Settings>, options?: UpdateSettingsOptions) => void
    isSettingsChanged: boolean
    resetSettings: () => void
    updatePageSettings: (settings: Partial<Settings>) => () => void
}

export const SettingsContext = createContext<SettingsContextProps | null>(null)

type Props = {
    children: ReactNode
    settingsCookie: Settings | null
    mode?: Mode
    /** Branding config loaded server-side from the IPS backend (falls back to ENV/defaults when
     * unset or backend unavailable). Takes priority over the hardcoded themeConfig values so a
     * fresh session (no settings cookie yet) still reflects what was saved on the Branding
     * settings screen. */
    brandingSettings?: BrandingSettings
}

export const SettingsProvider = (props: Props) => {

    // Initial Settings
    const initialSettings: Settings = {
        mode: themeConfig.mode,
        skin: themeConfig.skin,
        semiDark: themeConfig.semiDark,
        layout: themeConfig.layout,
        navbarContentWidth: themeConfig.navbar.contentWidth,
        contentWidth: themeConfig.contentWidth,
        footerContentWidth: themeConfig.footer.contentWidth,
        primaryColor: props.brandingSettings?.palette?.primary || primaryColorConfig[0].main,
        palette: props.brandingSettings?.palette || DEFAULT_BRANDING_PALETTE,
        logos: props.brandingSettings?.logos || DEFAULT_BRANDING_LOGOS,
        fontFamily: props.brandingSettings?.fontFamily || themeConfig.fontFamily,
        // Priority: Backend branding config -> ENV default -> themeConfig hardcoded default.
        brandingName: props.brandingSettings?.brandingName || env.NEXT_PUBLIC_APPLICATION_TITLE || themeConfig.templateName
    }

    const updatedInitialSettings = {
        ...initialSettings,
        mode: props.mode || themeConfig.mode
    }

    // Merge cookie settings with updated initial settings to ensure new fields are present
    const cookieWithDefaults = useMemo(() => {
        return {
            ...updatedInitialSettings,
            ...(props.settingsCookie || {})
        }
    }, [props.settingsCookie, updatedInitialSettings])

    const [settingsCookie, updateSettingsCookie] = useObjectCookie<Settings>(
        themeConfig.settingsCookieName,
        JSON.stringify(props.settingsCookie) !== '{}' ? cookieWithDefaults : updatedInitialSettings
    )

    // State
    const [_settingsState, _updateSettingsState] = useState<Settings>(
        JSON.stringify(settingsCookie) !== '{}' ? settingsCookie : updatedInitialSettings
    )

    const updateSettings = (settings: Partial<Settings>, options?: UpdateSettingsOptions) => {
        const { updateCookie = true } = options || {}

        _updateSettingsState(prev => {
            const newSettings = { ...prev, ...settings }

            // Update cookie if needed
            if (updateCookie) updateSettingsCookie(newSettings)

            return newSettings
        })
    }

    const isSettingsChanged = useMemo(
        () => JSON.stringify(initialSettings) !== JSON.stringify(_settingsState),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [_settingsState]
    )
    /**
  * Updates the settings for page with the provided settings object.
  * Updated settings won't be saved to cookie hence will be reverted once navigating away from the page.
  *
  * @param settings - The partial settings object containing the properties to update.
  * @returns A function to reset the page settings.
  *
  * @example
  * useEffect(() => {
  *     return updatePageSettings({ theme: 'dark' });
  * }, []);
  */
    const updatePageSettings = (settings: Partial<Settings>): (() => void) => {
        updateSettings(settings, { updateCookie: false })

        // Returns a function to reset the page settings
        return () => updateSettings(settingsCookie, { updateCookie: false })
    }
    const resetSettings = () => {
        updateSettings(initialSettings)
    }
    return (
        <SettingsContext.Provider
            value={{
                settings: _settingsState,
                updateSettings,
                isSettingsChanged,
                resetSettings,
                updatePageSettings
            }}
        >
            {props.children}
        </SettingsContext.Provider>
    )
}
