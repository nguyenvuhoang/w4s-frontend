// Client-safe branding types/constants — no Node-only imports here so this file can be imported
// from both server code (brandingGateway.server, brandingSettingsService) and 'use client'
// components.

/**
 * The backend has a single `logo_url` string field. To support multiple logo slots without
 * adding new backend fields, `logo_url` carries a JSON-encoded object of this shape:
 *   {"banner":"...","top_menu":"...","favicon":"...","loading":"...","login_title":"..."}
 * parseBrandingLogos/serializeBrandingLogos below are the only places that (de)serialize it —
 * everywhere else in the FE works with the plain BrandingLogos object.
 */
export type BrandingLogoKey = 'banner' | 'top_menu' | 'favicon' | 'loading' | 'login_title'

export const BRANDING_LOGO_KEYS: BrandingLogoKey[] = ['banner', 'top_menu', 'favicon', 'loading', 'login_title']

export type BrandingLogos = Record<BrandingLogoKey, string>

export const DEFAULT_BRANDING_LOGOS: BrandingLogos = {
  banner: '',
  top_menu: '',
  favicon: '',
  loading: '',
  login_title: ''
}

/**
 * The backend also has a single `primary_color` string field. To support a full coordinated
 * color palette (not just one primary color) without adding new backend fields, `primary_color`
 * carries a JSON-encoded object of this shape instead. parseBrandingPalette/serializeBrandingPalette
 * below are the only places that (de)serialize it — everywhere else in the FE works with the
 * plain BrandingPalette object.
 */
export type BrandingPaletteColorKey =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'background'
  | 'surface'
  | 'text_primary'
  | 'text_secondary'

export const BRANDING_PALETTE_COLOR_KEYS: BrandingPaletteColorKey[] = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text_primary',
  'text_secondary'
]

export type BrandingPalette = { name: string } & Record<BrandingPaletteColorKey, string>

/** Curated, balanced palettes with good text/background contrast — users pick a theme instead of
 * hand-mixing colors. Shown as preset cards in System Settings > Branding. */
export const BRANDING_PALETTE_PRESETS: BrandingPalette[] = [
  {
    name: 'Ocean Blue',
    primary: '#225087',
    secondary: '#3E7CB1',
    accent: '#F4A261',
    background: '#F7FAFC',
    surface: '#FFFFFF',
    text_primary: '#172B4D',
    text_secondary: '#5C6B7A'
  },
  {
    name: 'Emerald',
    primary: '#146B4A',
    secondary: '#2E8B68',
    accent: '#E9B44C',
    background: '#F8FBF9',
    surface: '#FFFFFF',
    text_primary: '#16352A',
    text_secondary: '#4F6B5F'
  },
  {
    name: 'Sunset',
    primary: '#E76F51',
    secondary: '#F4A261',
    accent: '#2A9D8F',
    background: '#FFF9F4',
    surface: '#FFFFFF',
    text_primary: '#3D2C2A',
    text_secondary: '#7A5C52'
  },
  {
    name: 'Royal Violet',
    primary: '#5B3A9B',
    secondary: '#8B6FC2',
    accent: '#F2B138',
    background: '#F9F7FC',
    surface: '#FFFFFF',
    text_primary: '#2E1A4D',
    text_secondary: '#6B5C87'
  },
  {
    name: 'Slate Graphite',
    primary: '#334155',
    secondary: '#64748B',
    accent: '#0EA5E9',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text_primary: '#0F172A',
    text_secondary: '#475569'
  },
  {
    name: 'Crimson Ruby',
    primary: '#B3213E',
    secondary: '#D9536A',
    accent: '#F0A500',
    background: '#FDF6F7',
    surface: '#FFFFFF',
    text_primary: '#4A0E1C',
    text_secondary: '#8A5A63'
  }
]

export const DEFAULT_BRANDING_PALETTE: BrandingPalette = BRANDING_PALETTE_PRESETS[0]

export type BrandingSettings = {
  brandingName: string
  logos: BrandingLogos
  palette: BrandingPalette
  fontFamily: string
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  brandingName: 'IPS',
  logos: { ...DEFAULT_BRANDING_LOGOS },
  palette: { ...DEFAULT_BRANDING_PALETTE },
  fontFamily: 'Quicksand, sans-serif'
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

/**
 * Safely parses the backend's `logo_url` value into a BrandingLogos record. Handles every edge
 * case the backend can hand back:
 *   - null / undefined / empty string -> all-blank defaults
 *   - valid JSON object with some/all keys -> merged with defaults for any missing key
 *   - legacy plain URL string (pre-multi-logo `logo_url`, not JSON) -> treated as the old single
 *     logo, mapped to `banner` (the main sidebar logo it used to control)
 *   - malformed/garbage JSON -> all-blank defaults, never throws
 */
export const parseBrandingLogos = (raw: unknown): BrandingLogos => {
  if (typeof raw !== 'string' || !raw.trim()) return { ...DEFAULT_BRANDING_LOGOS }

  const trimmed = raw.trim()

  // Legacy data written before this feature existed: a bare URL, not JSON at all.
  if (!trimmed.startsWith('{')) {
    return { ...DEFAULT_BRANDING_LOGOS, banner: trimmed }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_BRANDING_LOGOS }
    }

    const source = parsed as Record<string, unknown>
    const result = { ...DEFAULT_BRANDING_LOGOS }

    for (const key of BRANDING_LOGO_KEYS) {
      const value = source[key]

      if (typeof value === 'string') result[key] = value
    }

    return result
  } catch {
    return { ...DEFAULT_BRANDING_LOGOS }
  }
}

/** Serializes a BrandingLogos record back into the single `logo_url` JSON string the backend
 * expects. Always emits all 5 keys (even if blank) for a stable, predictable shape. */
export const serializeBrandingLogos = (logos: Partial<BrandingLogos>): string => {
  const merged: BrandingLogos = { ...DEFAULT_BRANDING_LOGOS, ...logos }

  return JSON.stringify(merged)
}

/**
 * Safely parses the backend's `primary_color` value into a full BrandingPalette. Handles every
 * edge case the backend can hand back:
 *   - null / undefined / empty string -> default palette (Ocean Blue)
 *   - valid JSON palette object -> merged with defaults for any missing/invalid field
 *   - legacy plain HEX string (pre-palette `primary_color`, e.g. "#225087") -> backward
 *     compatible: default palette's shape, but with `primary` set to that HEX and name "Custom"
 *     so the user's previously chosen color isn't silently discarded
 *   - malformed/garbage JSON -> default palette, never throws
 */
export const parseBrandingPalette = (raw: unknown): BrandingPalette => {
  if (typeof raw !== 'string' || !raw.trim()) return { ...DEFAULT_BRANDING_PALETTE }

  const trimmed = raw.trim()

  if (!trimmed.startsWith('{')) {
    // Legacy single-HEX primary_color from before this feature existed.
    if (HEX_COLOR_PATTERN.test(trimmed)) {
      return { ...DEFAULT_BRANDING_PALETTE, name: 'Custom', primary: trimmed }
    }

    return { ...DEFAULT_BRANDING_PALETTE }
  }

  try {
    const parsed: unknown = JSON.parse(trimmed)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_BRANDING_PALETTE }
    }

    const source = parsed as Record<string, unknown>
    const result: BrandingPalette = { ...DEFAULT_BRANDING_PALETTE }

    if (typeof source.name === 'string' && source.name.trim()) result.name = source.name.trim()

    for (const key of BRANDING_PALETTE_COLOR_KEYS) {
      const value = source[key]

      if (typeof value === 'string' && HEX_COLOR_PATTERN.test(value)) result[key] = value
    }

    return result
  } catch {
    return { ...DEFAULT_BRANDING_PALETTE }
  }
}

/** Serializes a BrandingPalette back into the single `primary_color` JSON string the backend
 * expects. Always emits the full shape for a stable, predictable format. */
export const serializeBrandingPalette = (palette: Partial<BrandingPalette>): string => {
  const merged: BrandingPalette = { ...DEFAULT_BRANDING_PALETTE, ...palette }

  return JSON.stringify(merged)
}
