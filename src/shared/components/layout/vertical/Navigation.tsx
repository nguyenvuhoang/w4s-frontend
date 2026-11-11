'use client'

import { useEffect, useRef, useState } from 'react'

import { RouterLink as Link } from '@menu/components/RouterLink'
import { useParams } from 'next/navigation'

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { Box, IconButton, Tooltip } from '@mui/material'

import type { getDictionary } from '@utils/getDictionary'
import type { Locale } from '@configs/i18n'

import Logo from '@components/layout/shared/Logo'
import VerticalNav, { NavHeader } from '@menu/vertical-menu'
import VerticalMenu from './VerticalMenu'
import SidebarUtilityMenu from './SidebarUtilityMenu'
import Logout from '@components/layout/shared/Logout'

import { useSettings } from '@core/hooks/useSettings'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import useSidebarCollapse from './useSidebarCollapse'
import { useAppContext } from '@contexts/AppContext'

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
  onMenuItemNavigate?: () => void
}

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: 0,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: '100%',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(${theme.direction === 'rtl' ? '0deg' : '180deg'},
  var(--mui-palette-primary-main) 0%,
  rgb(var(--mui-palette-primary-mainChannel) / 0.92) 30%,
  rgb(var(--mui-palette-primary-mainChannel) / 0.58) 65%,
  transparent 100%)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const Navigation = (props: Props) => {
  const { dictionary, menudata, onMenuItemClick, onMenuItemNavigate } = props

  const verticalNavOptions = useVerticalNav()
  const { settings } = useSettings()
  const { collapsed, toggleSidebar } = useSidebarCollapse(settings.layout === 'collapsed')
  const { locale } = useParams()
  const theme = useTheme()
const { userInfo } = useAppContext()

  // While the "Cài đặt" fan menu is open, the rest of the sidebar (main menu, logout, collapse
  // toggle) must stop reacting to click/hover so a mis-click can't land on the menu behind it.
  const [isUtilityFanOpen, setIsUtilityFanOpen] = useState(false)

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || ['1', 'true', 'yes', 'y', 't'].includes(String(value ?? '').trim().toLowerCase())

const isSuperAdmin = ['is_supper_admin', 'issuperadmin', 'is_super_admin', 'isSuperAdmin'].some(
  key => isTruthyFlag((userInfo as Record<string, unknown> | null)?.[key])
)

  const shadowRef = useRef(null)

  const { isCollapsed, isHovered, collapseVerticalNav, isBreakpointReached } = verticalNavOptions
  const common = dictionary.common ?? {}
  const collapseLabel = common.collapsemenu ?? common.close ?? ''
  const expandLabel = common.expandmenu ?? common.menu ?? ''
  const toggleLabel = collapsed ? expandLabel : collapseLabel
  const showToggleButton = !isBreakpointReached && (!isCollapsed || isHovered)
  const showFooterLabels = Boolean(!isCollapsed || isHovered)

  const footerLabels = {
    utilities: common.sidebarutilities || 'Cài đặt',
    systemSettings: dictionary['navigation'].system_settings || 'System Settings',
    clearCache: common.clearcache || common.reloadcache || 'Reload cache',
    language: common.language || dictionary['navigation'].language || 'Language',
    layout: common.layout || 'Layout',
    logout: common.logout || 'Đăng xuất'
  }

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

  const { data: session } = useSession()

  const handleClearCache = async () => {
    if (!session?.user?.token) return

    try {
      const res = await learnAPIService.clearCache({
        sessiontoken: session.user.token as string,
        language: locale as string
      })
      const payload = res.payload as any

      const isSuccess = res.status === 200 && (payload?.success === true || isValidResponse(res))

      if (isSuccess) {
        SwalAlert('success', 'Clear cache successful', 'center')
      } else {
        const error =
          payload?.data?.message ||
          payload?.data?.errors?.[0]?.info ||
          payload?.message ||
          payload?.dataresponse?.errors?.[0]?.info ||
          'Clear cache failed'
        SwalAlert('error', error, 'center')
      }
    } catch {
      SwalAlert('error', 'An unexpected error occurred', 'center')
    }
  }

  return (
    <>
      <VerticalNav
        width={SIDEBAR_WIDTH}
        customStyles={navigationCustomStyles(verticalNavOptions, theme)}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        backgroundColor='var(--mui-palette-primary-main)'
        transitionDuration={SIDEBAR_TOGGLE_DURATION}
        data-mui-color-scheme='dark'
        style={{ '--menu-inactive-color': 'rgba(255, 255, 255, 0.85)' } as any}
      >
        <Box className='flex flex-col h-full' sx={{ position: 'relative' }}>
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
            onMenuItemNavigate={onMenuItemNavigate}
            menudata={menudata}
          />

          <Box
            className='mt-auto pbs-6 pbe-6 flex flex-col gap-1 text-white'
            sx={{
              alignItems: isCollapsed && !isHovered ? 'center' : 'flex-start',
              px: isCollapsed && !isHovered ? 0 : 3,
              transition: theme.transitions.create(['padding', 'align-items'], {
                duration: SIDEBAR_TOGGLE_DURATION
              })
            }}
          >
            <SidebarUtilityMenu
              isSuperAdmin={isSuperAdmin}
              labels={footerLabels}
              showLabel={showFooterLabels}
              onClearCache={handleClearCache}
              onOpenChange={setIsUtilityFanOpen}
            />

            {/*
              Single stable instance across collapse/hover changes — same pattern as
              LanguageDropdown/LayoutToggle above. Swapping between two differently-wrapped
              JSX trees here (e.g. a ternary between `<Logout>` and `<Tooltip><Logout/></Tooltip>`)
              makes React unmount/remount Logout whenever `showFooterLabels` flips, which wipes
              its in-flight `isLoggingOut` state and made the button look broken mid-click.
            */}
            <Logout showLabel={showFooterLabels} fullWidth label={footerLabels.logout} colorVariant='warning' />
          </Box>

          {/*
            Blocks click/hover on the rest of the sidebar (main menu, logout, collapse toggle)
            while the "Cài đặt" fan menu is open, so a tap meant for a fan bubble can't fall
            through onto the menu item behind it. Sits above everything here via z-index, but
            SidebarUtilityMenu's own trigger button opts back in with a higher z-index + explicit
            pointerEvents so it (and the fan bubbles, portaled separately at a much higher
            z-index) stay clickable.
          */}
          <Box
            aria-hidden={isUtilityFanOpen}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              opacity: isUtilityFanOpen ? 1 : 0,
              pointerEvents: isUtilityFanOpen ? 'auto' : 'none',
              transition: theme.transitions.create('opacity', { duration: 150 })
            }}
          />
        </Box>
      </VerticalNav>

      <div className='sxl:hidden custom-backdrop' style={{ zIndex: 10 } as any}></div>
    </>
  )
}

export default Navigation
