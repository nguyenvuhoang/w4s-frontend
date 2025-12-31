'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import { styled, useColorScheme, useTheme } from '@mui/material/styles'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import VeriticalSubNav from '@/@menu/components/vertical-menu/VeriticalSubNav'
import { VerticalSubMenuDataType } from '@/types/menuTypes'
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import VerticalSubMenu from './VerticalSubMenu'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menudata: VerticalSubMenuDataType[]
}

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(var(--mui-palette-background-default) ${theme.direction === 'rtl' ? '95%' : '5%'
    }, rgb(var(--mui-palette-background-defaultChannel) / 0.85) 30%, rgb(var(--mui-palette-background-defaultChannel) / 0.5) 65%, rgb(var(--mui-palette-background-defaultChannel) / 0.3) 75%, transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const Navigation = (props: Props) => {
  // Props
  const { dictionary, menudata } = props

  // Hooks
  const verticalNavOptions = useVerticalNav()
  const { settings } = useSettings()
  const { locale } = useParams()
  const { mode: muiMode, systemMode: muiSystemMode } = useColorScheme()
  const theme = useTheme()

  // State
  const [isSubNavVisible, setIsSubNavVisible] = useState(false)
  const [clickedItem, setClickedItem] = useState<VerticalSubMenuDataType | null>(null); // State to store clicked item

  // Refs
  const shadowRef = useRef(null)

  // Vars
  const { collapseVerticalNav, isBreakpointReached } = verticalNavOptions
  const isSemiDark = settings.semiDark
  let isDark = muiMode === 'dark' || (muiMode === 'system' && muiSystemMode === 'dark')


  const scrollMenu = (container: any, isPerfectScrollbar: boolean) => {
    container = isBreakpointReached || !isPerfectScrollbar ? container.target : container

    if (shadowRef && container.scrollTop > 0) {
      // @ts-ignore
      if (!shadowRef.current.classList.contains('scrolled')) {
        // @ts-ignore
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      // @ts-ignore
      shadowRef.current.classList.remove('scrolled')
    }
  }

  useEffect(() => {
    if (settings.layout === 'collapsed') {
      collapseVerticalNav(true)
    } else {
      collapseVerticalNav(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.layout])

  const handleMenuItemClick = (item: VerticalSubMenuDataType) => {
    setIsSubNavVisible(prev => !prev)
    setClickedItem(item);
  }

  const subNavId = "veritical-sub-nav";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const subNavElement = document.getElementById(subNavId);
      if (subNavElement && !subNavElement.contains(event.target as Node)) {
        setIsSubNavVisible(false);
      }
    }

    if (isSubNavVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSubNavVisible])

  return (
    // Sidebar Vertical Menu
    <>
      <VerticalNav
        customStyles={navigationCustomStyles(verticalNavOptions, theme)}
        collapsedWidth={71}
        backgroundColor='transparent'
        {...(isSemiDark &&
          !isDark && {
          'data-mui-color-scheme': 'dark'
        })}
      >
        {/* Nav Header including Logo & nav toggle icons  */}
        <NavHeader>
          <Link href={getLocalizedUrl('/', locale as Locale)}>
            <Logo />
          </Link>
        </NavHeader>
        <StyledBoxForShadow ref={shadowRef} />
        <VerticalMenu
          dictionary={dictionary}
          scrollMenu={scrollMenu}
          onMenuItemClick={handleMenuItemClick}
          menudata={menudata}
        />
      </VerticalNav>
      {/* Submenu Vertical Menu */}
      {isSubNavVisible &&
        <>
          <VeriticalSubNav
            id={subNavId}
            customStyles={navigationCustomStyles(verticalNavOptions, theme)}
            collapsedWidth={71}
            backgroundColor='#F3F5F7'
            className='!z-30'
            {...(isSemiDark &&
              !isDark && {
              'data-mui-color-scheme': 'dark'
            })}
            style={{
              position: 'absolute',
              left: '300px',
              height: '100vh'
            }}
          >
            <NavHeader>
              <Link
                href="#"
                className='flex items-center justify-center space-x-1'
              >
                <i className='ri-information-2-line text-[#A1C038] w-7 h-7' />
                <span className='text-gray-600 font-sans italic'>{dictionary['common'].description_feature}</span>
              </Link>
            </NavHeader>
            <StyledBoxForShadow ref={shadowRef} />
            <VerticalSubMenu dictionary={dictionary} scrollMenu={scrollMenu} parentItem={clickedItem} setIsSubNavVisible={setIsSubNavVisible} />
          </VeriticalSubNav>
        </>
      }
      <div className={`-sxl:hidden custom-backdrop ${isSubNavVisible ? ' show-backdrop' : ''}`}></div>
      <div className="sxl:hidden custom-backdrop"></div>
    </>
  );
}

export default Navigation
