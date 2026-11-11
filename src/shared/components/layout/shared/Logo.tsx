'use client'

// React Imports
import type { CSSProperties } from 'react'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const DEFAULT_FAVICON = '/images/logobank/FavIcon.svg'
const DEFAULT_LOGO = '/images/logobank/logo-white.svg'

type LogoProps = {
  color?: CSSProperties['color']
  /** 'sidebar' (default): the vertical nav rail — collapsed shows the FavIcon logo slot,
   * expanded shows the Banner logo slot. 'topMenu': the horizontal layout's top navbar, always
   * uses the Top Menu logo slot. */
  variant?: 'sidebar' | 'topMenu'
}

const Logo = ({ color, variant = 'sidebar' }: LogoProps) => {
  // Hooks
  const { isCollapsed, isHovered } = useVerticalNav()
  const { settings } = useSettings()
  const compact = variant === 'sidebar' && isCollapsed && !isHovered

  // Custom branding logos (System Settings > Branding > Bộ nhận diện Logo) apply per slot,
  // falling back to the default IPS assets when a slot isn't configured.
  const logoSrc = variant === 'topMenu'
    ? settings.logos?.top_menu || DEFAULT_LOGO
    : (compact ? settings.logos?.favicon || DEFAULT_FAVICON : settings.logos?.banner || DEFAULT_LOGO)

  return (
    <div className='flex items-center justify-center min-bs-[24px] overflow-hidden'>
      <img
        src={logoSrc}
        alt={settings.brandingName || 'IPS'}
        style={{
          color,
          height: compact ? '64px' : '38px',
          width: compact ? '104px' : '118px',
          objectFit: 'contain',
          objectPosition: compact ? 'left center' : 'center',
          transform: compact ? 'translateX(21px)' : 'none'
        }}
      />
    </div>
  )
}

export default Logo
