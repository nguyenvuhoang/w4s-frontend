import type { Layout, LayoutComponentPosition, LayoutComponentWidth, Mode, Skin } from '@core/types'
type Navbar = {
    type: LayoutComponentPosition
    contentWidth: LayoutComponentWidth
    floating: boolean
    detached: boolean
    blur: boolean
}
type Footer = {
    type: LayoutComponentPosition
    contentWidth: LayoutComponentWidth
    detached: boolean
}
export type Config = {
    templateName: string
    homePageUrl: string
    settingsCookieName: string
    mode: Mode
    skin: Skin
    semiDark: boolean
    layout: Layout
    layoutPadding: number
    navbar: Navbar
    contentWidth: LayoutComponentWidth
    compactContentWidth: number
    footer: Footer
    disableRipple: boolean
    logoUrl?: string
    fontFamily?: string
}
const themeConfig: Config = {
    templateName: 'ANHBEN',
    homePageUrl: '/dashboards',
    settingsCookieName: 'o24openui',
    mode: 'light', // 'system', 'light', 'dark'
    skin: 'bordered', // 'default', 'bordered'
    semiDark: false, // true, false
    layout: 'horizontal', // 'vertical', 'collapsed', 'horizontal'
    layoutPadding: 24, // Common padding for header, content, footer layout components (in px)
    compactContentWidth: 1440, // in px
    navbar: {
        type: 'fixed', // 'fixed', 'static'
        contentWidth: 'wide', // 'compact', 'wide'
        floating: false, //! true, false (This will not work in the Horizontal Layout)
        detached: true, //! true, false (This will not work in the Horizontal Layout or floating navbar is enabled)
        blur: false // true, false
    },
    contentWidth: 'wide', // 'compact', 'wide'
    footer: {
        type: 'static', // 'fixed', 'static'
        contentWidth: 'wide', // 'compact', 'wide'
        detached: true //! true, false (This will not work in the Horizontal Layout)
    },
    disableRipple: false, // true, false
    logoUrl: '', // Default logo from SVG
    fontFamily: 'var(--font-quicksand-sans), Quicksand, sans-serif'
}
export default themeConfig
