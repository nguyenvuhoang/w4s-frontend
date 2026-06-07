'use client'

// React Imports
import { useEffect, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { Box, IconButton, Tooltip } from '@mui/material'

// Type Imports
import type { getDictionary } from '@utils/getDictionary'
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import LayoutToggle from '@components/layout/shared/LayoutToggle'
import Logout from '../shared/Logout'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import useSidebarCollapse from './useSidebarCollapse'

// Util Imports
import { getLocalizedUrl } from '@utils/i18n'

import { VerticalSubMenuDataType } from '@shared/types/menuTypes'
import navigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

import { useSession } from 'next-auth/react'
import { learnAPIService } from '@/servers/system-service/services/learnapi.service'
import { isValidResponse } from '@/shared/utils/isValidResponse'
import SwalAlert from '@/shared/utils/SwalAlert'
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_TOGGLE_DURATION,
  SIDEBAR_WIDTH
} from './sidebarConstants'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menudata: VerticalSubMenuDataType[]
  onMenuItemClick?: (item: VerticalSubMenuDataType) => void
  activeItem?: VerticalSubMenuDataType | null
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
  const { dictionary, menudata, onMenuItemClick, activeItem } = props

  // Hooks
  const verticalNavOptions = useVerticalNav()
  const { settings } = useSettings()
  const { collapsed, toggleSidebar } = useSidebarCollapse(settings.layout === 'collapsed')
  const { locale } = useParams()
  const theme = useTheme()

  // Refs
  const shadowRef = useRef(null)

  // Vars
  const { isCollapsed, isHovered, collapseVerticalNav, isBreakpointReached } = verticalNavOptions
  const common = dictionary.common ?? {}
  const collapseLabel = common.collapsemenu ?? common.close ?? ''
  const expandLabel = common.expandmenu ?? common.menu ?? ''
  const toggleLabel = collapsed ? expandLabel : collapseLabel
  const showToggleButton = !isBreakpointReached && (!isCollapsed || isHovered)


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
    if (isBreakpointReached && isCollapsed) {
      collapseVerticalNav(false)
    }
  }, [collapseVerticalNav, isBreakpointReached, isCollapsed])

  const { data: session } = useSession();

  const handleClearCache = async () => {
    if (!session?.user?.token) return;

    try {
      const res = await learnAPIService.clearCache({
        sessiontoken: session.user.token as string,
        language: locale as string
      });

      if (isValidResponse(res)) {
        SwalAlert('success', 'Clear cache successful', 'center');
      } else {
        const error = res.payload.dataresponse.errors?.[0]?.info || 'Clear cache failed';
        SwalAlert('error', error, 'center');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      SwalAlert('error', 'An unexpected error occurred', 'center');
    }
  };

  return (
    // Sidebar Vertical Menu
    <>
      <VerticalNav
        width={SIDEBAR_WIDTH}
        customStyles={navigationCustomStyles(verticalNavOptions, theme)}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        backgroundColor='#225087'
        transitionDuration={SIDEBAR_TOGGLE_DURATION}
        data-mui-color-scheme='dark'
        style={{ '--menu-inactive-color': 'rgba(255, 255, 255, 0.85)' } as any}
      >
        <Box className='flex flex-col h-full'>
          {/* Nav Header including Logo & nav toggle icons  */}
          <NavHeader>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pr: showToggleButton ? 1 : 0
              }}
            >
              <Link href={getLocalizedUrl('/', locale as Locale)}>
                <Logo />
              </Link>

              {showToggleButton && (
                <Tooltip title={toggleLabel} placement='right'>
                  <IconButton
                    aria-label={toggleLabel}
                    size='small'
                    onClick={toggleSidebar}
                    sx={{
                      position: 'absolute',
                      insetInlineEnd: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      border: `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
                      backgroundColor: alpha(theme.palette.common.white, 0.12),
                      boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.18)}`,
                      transition: theme.transitions.create(['background-color', 'border-color'], {
                        duration: SIDEBAR_TOGGLE_DURATION
                      }),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.2)
                      }
                    }}
                  >
                    {collapsed ? (
                      <ChevronRightRounded fontSize='small' />
                    ) : (
                      <ChevronLeftRounded fontSize='small' />
                    )}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </NavHeader>
          <StyledBoxForShadow ref={shadowRef} />
          <VerticalMenu
            dictionary={dictionary}
            scrollMenu={scrollMenu}
            onMenuItemClick={onMenuItemClick}
            menudata={menudata}
            activeItem={activeItem}
          />
          <Box
            className='mt-auto pbs-4 pbe-6 flex flex-col gap-1 text-white'
            sx={{
              alignItems: isCollapsed && !isHovered ? 'center' : 'flex-start',
              px: isCollapsed && !isHovered ? 0 : 6,
              transition: theme.transitions.create(['padding', 'align-items'], {
                duration: SIDEBAR_TOGGLE_DURATION
              })
            }}
          >
            <Link href={getLocalizedUrl('/system-settings', locale as Locale)}>
              <IconButton size='small' color='inherit' title={dictionary['navigation'].system_settings || 'System Settings'} className='text-white'>
                <i className='ri-settings-3-line text-[22px] text-white' />
              </IconButton>
            </Link>
            <IconButton size='small' color='inherit' title='Clear Cache' onClick={handleClearCache} className='text-white'>
              <i className='ri-refresh-line text-[22px] text-white' />
            </IconButton>
            <LanguageDropdown />
            <LayoutToggle />
            <Logout />
          </Box>
        </Box>
      </VerticalNav>
      <div className="sxl:hidden custom-backdrop" style={{ zIndex: 10 } as any}></div>
    </>
  );
}

export default Navigation

