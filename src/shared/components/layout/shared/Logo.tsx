'use client'

// React Imports
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

// Component Imports
import LogoBank from '@core/svg/Logo'


// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useVerticalNav from '@menu/hooks/useVerticalNav'

const Logo = ({ color }: { color?: CSSProperties['color'] }) => {
  // Refs
  const logoTextRef = useRef<HTMLSpanElement>(null)

  // Hooks
  const { isHovered } = useVerticalNav()
  const { settings } = useSettings()

  // Vars
  const { layout } = settings

  useEffect(() => {
    if (layout !== 'collapsed') {
      return
    }

    if (logoTextRef && logoTextRef.current) {
      if (layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout])

  return (
    <div className='flex items-center min-bs-[24px]'>
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt="Logo" style={{ height: '40px', width: 'auto' }} />
      ) : (
        <LogoBank width="64" height="64" />
      )}
    </div>
  )
}

export default Logo
