'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import { styled, useColorScheme, useTheme } from '@mui/material/styles'

// Type Imports
import type { getDictionary } from '@utils/getDictionary'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import LayoutToggle from '@components/layout/shared/LayoutToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import Logout from '../shared/Logout'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { getLocalizedUrl } from '@utils/i18n'

// Style Imports
import VeriticalSubNav from '@/@menu/components/vertical-menu/VeriticalSubNav'
import { VerticalSubMenuDataType } from '@shared/types/menuTypes'
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import VerticalSubMenu from './VerticalSubMenu'
import { MenuItem } from '@shared/types/systemTypes'

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
    // If the same item is clicked, toggle visibility. If a new item is clicked, show it.
    const isSameItem = clickedItem && (
      (item.id && clickedItem.id === item.id) ||
      (item.label && clickedItem.label === item.label)
    );

    if (isSameItem) {
      setIsSubNavVisible(prev => !prev)
    } else {
      setIsSubNavVisible(true)
      setClickedItem(item)
    }
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
        backgroundColor='#225087'
        data-mui-color-scheme='dark'
        style={{ '--menu-inactive-color': 'rgba(255, 255, 255, 0.85)' } as any}
      >
        <div className='flex flex-col h-full'>
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
            activeItem={clickedItem}
          />
          <div className='mt-auto pli-6 pbs-4 pbe-6 flex flex-col items-start gap-1 text-white'>
            <ModeDropdown />
            <LanguageDropdown />
            <LayoutToggle />
            <Logout />
          </div>
        </div>
      </VerticalNav>
      {/* Submenu Vertical Menu */}
      {isSubNavVisible &&
        <>
          <VeriticalSubNav
            id={subNavId}
            customStyles={navigationCustomStyles(verticalNavOptions, theme)}
            collapsedWidth={71}
            backgroundColor='#FFFFFF'
            className='!z-40 text-gray-900'
            style={{
              position: 'absolute',
              left: '300px',
              height: '100vh',
              '--menu-inactive-color': 'rgba(0, 0, 0, 0.6)',
              boxShadow: '10px 0 50px rgba(0,0,0,0.15)',
              borderLeft: '1px solid #e0e0e0'
            } as any}
          >
            <NavHeader>
              <Link
                href="#"
                className='flex items-center justify-center space-x-1'
              >
                <i className='ri-information-2-line text-[#A1C038] w-7 h-7' />
                <span className='text-gray-500 font-sans italic'>{dictionary['common'].description_feature}</span>
              </Link>
            </NavHeader>
            <StyledBoxForShadow ref={shadowRef} />
            <VerticalSubMenu
              key={clickedItem?.id || (typeof clickedItem?.label === 'string' ? clickedItem.label : 'submenu')}
              dictionary={dictionary}
              scrollMenu={scrollMenu}
              parentItem={clickedItem}
              setIsSubNavVisible={setIsSubNavVisible}
            />
          </VeriticalSubNav>
        </>
      }
      <div className={`-sxl:hidden custom-backdrop ${isSubNavVisible ? ' show-backdrop' : ''}`} style={{ zIndex: 10 } as any}></div>
      <div className="sxl:hidden custom-backdrop" style={{ zIndex: 10 } as any}></div>
    </>
  );
}

export default Navigation

