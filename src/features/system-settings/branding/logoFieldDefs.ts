import type { BrandingLogoKey } from '@shared/constants/branding'

export type LogoFieldDef = {
    key: BrandingLogoKey
    /** i18n key for the field's own title (e.g. "Logo Banner"). */
    labelKey: string
    /** i18n key for the recommended-size description line. */
    sizeKey: string
    /** i18n key for the recommended-ratio description line. */
    ratioKey: string
    /** Target width/height used only to compute the expected ratio for the soft aspect-ratio
     * warning — not a hard pixel requirement. */
    width: number
    height: number
}

export const LOGO_FIELD_DEFS: LogoFieldDef[] = [
    {
        key: 'banner',
        labelKey: 'branding_logo_banner_label',
        sizeKey: 'branding_logo_banner_size',
        ratioKey: 'branding_logo_banner_ratio',
        width: 240,
        height: 80
    },
    {
        key: 'top_menu',
        labelKey: 'branding_logo_topmenu_label',
        sizeKey: 'branding_logo_topmenu_size',
        ratioKey: 'branding_logo_topmenu_ratio',
        width: 160,
        height: 48
    },
    {
        key: 'favicon',
        labelKey: 'branding_logo_favicon_label',
        sizeKey: 'branding_logo_favicon_size',
        ratioKey: 'branding_logo_favicon_ratio',
        width: 64,
        height: 64
    },
    {
        key: 'loading',
        labelKey: 'branding_logo_loading_label',
        sizeKey: 'branding_logo_loading_size',
        ratioKey: 'branding_logo_loading_ratio',
        width: 256,
        height: 256
    },
    {
        key: 'login_title',
        labelKey: 'branding_logo_logintitle_label',
        sizeKey: 'branding_logo_logintitle_size',
        ratioKey: 'branding_logo_logintitle_ratio',
        width: 300,
        height: 100
    }
]
