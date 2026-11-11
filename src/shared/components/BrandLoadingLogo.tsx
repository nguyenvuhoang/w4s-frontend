'use client'

import { keyframes } from '@emotion/react'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

import { appProfile } from '@configs/appProfile'

// Opacity + transform only: both are compositor-friendly, so the pulse stays cheap even when
// several loaders are mounted. Disabled entirely for users who prefer reduced motion.
const pulse = keyframes`
  0%, 100% {
    opacity: 0.55;
    transform: scale(0.96);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`

type BrandLoadingLogoProps = {
  /** 'light' (default): full-colour logo for light surfaces. 'dark': white mark for gradients. */
  tone?: 'light' | 'dark'
  /** Rendered width in px; height follows the asset's aspect ratio. */
  width?: number
  /** Overrides the profile asset — e.g. a logo configured in System Settings > Branding. */
  src?: string
  alt?: string
  sx?: SxProps<Theme>
}

/**
 * The single branded loading mark used by every loader (page Suspense/route loading, navigation
 * overlay, boot overlay, auth/submit spinners). Reuses the existing brand assets from the active
 * app profile (W4S by default) — never an inline vendor logo — so loaders stay consistent with
 * the login screen.
 */
const BrandLoadingLogo = ({ tone = 'light', width = 104, src, alt, sx }: BrandLoadingLogoProps) => (
  <Box
    component='img'
    src={src || (tone === 'dark' ? appProfile.logos.onDark : appProfile.logos.onLight)}
    alt={alt ?? appProfile.brandName}
    draggable={false}
    sx={{
      display: 'block',
      width,
      maxWidth: '100%',
      height: 'auto',
      objectFit: 'contain',
      userSelect: 'none',
      animation: `${pulse} 1.6s ease-in-out infinite`,
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      ...sx
    }}
  />
)

export default BrandLoadingLogo
