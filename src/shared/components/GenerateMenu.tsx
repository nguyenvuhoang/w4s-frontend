// React Imports
import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import Image from 'next/image'
import { useParams, usePathname } from 'next/navigation'

// MUI Imports
import * as Icons from '@mui/icons-material'
import type { ChipProps } from '@mui/material/Chip'
import Chip from '@mui/material/Chip'

// Type Imports
import type {
  HorizontalMenuDataType,
  HorizontalMenuItemDataType,
  HorizontalSubMenuDataType,
  VerticalMenuDataType,
  VerticalMenuItemDataType,
  VerticalSectionDataType,
  VerticalSubMenuDataType
} from '@shared/types/menuTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import { MenuItem as HorizontalMenuItem, SubMenu as HorizontalSubMenu } from '@menu/horizontal-menu'
import { MenuSection, MenuItem as VerticalMenuItem } from '@menu/vertical-menu'

// Util Imports
import { getLocalizedUrl } from '@utils/i18n'
import {
  excludeMenuRoutes,
  getCommandId,
  getFirstDescendantMenuRoute,
  getMenuRoute,
  getMenuTitle,
  getModuleCommandIdFromPath,
  isMenuActive,
  isUsableMenuRoute
} from './layout/shared/menu-utils'
import { filterMenuForSidebar } from '@shared/permissions/permissionUtils'

type MenuIconProps = {
  icon?: string
  size?: number
  color?: string
}

const MENU_ICON_GRADIENT = 'linear-gradient(135deg, #193A68 0%, #07A26B 100%)'

const NON_DOM_PROPS = new Set([
  'is_favorite',
  'is_agreement',
  'is_active',
  'is_visible',
  'command_type',
  'commandType',
  'command_id',
  'command_code',
  'parent_id',
  'sort_order',
  'menu_level',
  'workflow_id',
  'is_required',
  'is_check_permission',
  'is_external',
  'command_name',
  'command_name_language',
  'command_icon',
  'command_url',
  'commandUrl',
  'commandURL',
  'CommandURL',
  'command_uri',
  'commandUri',
  'commandURI',
  'CommandURI',
  'group_menu_icon',
  'label',
  'children',
  'items',
  'submenus',
  'utilities'
])

const getCommandType = (item: any) => item?.command_type ?? item?.commandType

const getChildren = (item: any): VerticalMenuDataType[] => item?.children || item?.items || item?.submenus || []

const isValidMenuItem = (item: any) => {
  const commandType = getCommandType(item)

  return !commandType || String(commandType).toUpperCase() === 'M'
}

const isImageIcon = (icon?: string): boolean => {
  if (!icon) return false

  return (
    icon.startsWith('/') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    /\.(svg|png|jpe?g|webp|gif)$/i.test(icon)
  )
}

export const MenuIcon = ({ icon, size = 20, color = MENU_ICON_GRADIENT }: MenuIconProps) => {
  const [imageError, setImageError] = useState(false)
  const gradientId = useId().replace(/:/g, '')
  const muiIcons = Icons as Record<string, typeof Icons.AppsRounded>
  const MUIIcon = icon && muiIcons[icon] ? muiIcons[icon] : Icons.AppsRounded
  const isGradientColor = color.includes('gradient')

  if (icon?.startsWith('ri-')) {
    return (
      <i
        className={icon}
        style={{
          fontSize: size,
          lineHeight: 1,
          ...(isGradientColor
            ? {
                background: color,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                WebkitTextFillColor: 'transparent'
              }
            : { color })
        }}
      />
    )
  }

  if (icon && isImageIcon(icon) && !imageError) {
    return (
      <Image
        src={icon}
        alt='menu icon'
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => setImageError(true)}
      />
    )
  }

  if (isGradientColor) {
    return (
      <>
        <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden='true' focusable='false'>
          <defs>
            <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' stopColor='#193A68' />
              <stop offset='100%' stopColor='#07A26B' />
            </linearGradient>
          </defs>
        </svg>
        <MUIIcon sx={{ fontSize: size, color: '#193A68', '& path': { fill: `url(#${gradientId})` } }} />
      </>
    )
  }

  return <MUIIcon sx={{ fontSize: size, color }} />
}

function stripNonDomProps<T extends Record<string, unknown>>(obj: T): T {
  const clean = { ...obj }

  for (const key of NON_DOM_PROPS) {
    delete (clean as Record<string, unknown>)[key]
  }

  return clean
}

function stripSubMenuLinkProps<T extends Record<string, unknown>>(obj: T): T {
  const clean = { ...obj }

  delete (clean as Record<string, unknown>).href
  delete (clean as Record<string, unknown>).target
  delete (clean as Record<string, unknown>).rel

  return clean
}

const renderChipOrNode = (node: ReactNode | ChipProps | undefined): ReactNode => {
  if (typeof node === 'string' || typeof node === 'number') return undefined

  return node && (node as ChipProps).label ? <Chip size='small' {...(node as ChipProps)} /> : (node as ReactNode)
}

export const GenerateVerticalMenu = ({
  menuData,
  onMenuItemClick,
  onMenuItemNavigate
}: {
  menuData: VerticalMenuDataType[]
  onMenuItemClick?: (item: VerticalSubMenuDataType) => void
  onMenuItemNavigate?: () => void
}) => {
  const { locale } = useParams()
  const pathname = usePathname()

  // Sidebar visibility must respect invoke + group_menu_visible, not just command_type — see
  // src/shared/permissions/permissionUtils.ts. Command (C) nodes never appear in the sidebar and
  // parents left with no valid children after filtering are pruned.
  const visibleMenuData = useMemo(
    () => excludeMenuRoutes(filterMenuForSidebar(menuData as any) as unknown as VerticalMenuDataType[]),
    [menuData]
  )

  // The `/module/[commandId]` hub route (a parent menu's submenu list) carries no business
  // screen path of its own, so it can never match via localizedRoute below — without this, the
  // parent menu would show inactive while its own hub screen is open.
  const moduleCommandId = getModuleCommandIdFromPath(pathname)

  const isMenuBranchActive = (item: any): boolean => {
    const route = getMenuRoute(item)
    const localizedRoute = route?.startsWith('http') ? route : route && getLocalizedUrl(route, locale as Locale)

    if (localizedRoute && isMenuActive(localizedRoute, pathname)) return true
    if (moduleCommandId && moduleCommandId === getCommandId(item)) return true

    return getChildren(item).some((child: any) => {
      return isMenuBranchActive(child)
    })
  }

  const renderMenuItems = (data: VerticalMenuDataType[] | unknown): ReactNode => {
    return (data as VerticalMenuDataType[]).map((item: VerticalMenuDataType, index: number) => {
      if (!isValidMenuItem(item) && !(item as any).isSection) return null

      const menuSectionItem = item as VerticalSectionDataType
      const subMenuItem = item as VerticalSubMenuDataType
      const menuItem = item as VerticalMenuItemDataType

      if (menuSectionItem.isSection) {
        const { children, isSection, ...rest } = menuSectionItem as any

        return (
          <MenuSection key={index} {...stripNonDomProps(rest)}>
            {children && renderMenuItems(children)}
          </MenuSection>
        )
      }

      const itemChildren = getChildren(subMenuItem).filter(isValidMenuItem)
      const itemLabel = getMenuTitle(subMenuItem, locale as string)

      if (itemChildren.length > 0) {
        const { icon, prefix, suffix, label, ...rest } = subMenuItem as any
        const parentRoute = getMenuRoute(subMenuItem)
        const route = isUsableMenuRoute(parentRoute) ? parentRoute : getFirstDescendantMenuRoute(subMenuItem)
        const effectiveHref = route?.startsWith('http')
          ? route
          : route && getLocalizedUrl(route, locale as Locale)
        // Active is derived exclusively from the current URL. Opening a group must never
        // apply the active background while the user remains on another route.
        const parentActive = isMenuBranchActive(subMenuItem)

        return (
          <VerticalMenuItem
            key={index}
            title={itemLabel || undefined}
            prefix={renderChipOrNode(prefix)}
            suffix={renderChipOrNode(suffix)}
            active={parentActive}
            data-prevent-progress="true"
            onClick={(event: any) => {
              // Keep a real link for browser context-menu and modified-click actions (opens
              // effectiveHref, e.g. the first descendant route, in a new tab).
              // A normal primary click instead navigates to this menu's own `/module/[commandId]`
              // hub route (see onMenuItemClick in DashboardShell) so the URL always reflects what
              // is on screen — required so a second click, refresh, or Back all behave correctly.
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

              event.preventDefault()
              onMenuItemClick?.(subMenuItem)
            }}
            {...stripSubMenuLinkProps(stripNonDomProps(rest))}
            href={effectiveHref}
            icon={<MenuIcon icon={icon || (subMenuItem as any).group_menu_icon || (subMenuItem as any).command_icon} size={20} color='currentColor' />}
          >
            {itemLabel}
          </VerticalMenuItem>
        )
      }

      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem as any
      const route = getMenuRoute(menuItem)
      const href = route?.startsWith('http')
        ? route
        : route && (excludeLang ? route : getLocalizedUrl(route, locale as Locale))

      return (
        <VerticalMenuItem
          key={index}
          title={itemLabel || undefined}
          prefix={renderChipOrNode(prefix)}
          suffix={renderChipOrNode(suffix)}
          {...stripNonDomProps(rest)}
          href={href}
          onClick={() => {
            onMenuItemNavigate?.()
          }}
          icon={<MenuIcon icon={icon || (menuItem as any).group_menu_icon || (menuItem as any).command_icon} size={20} color='currentColor' />}
        >
          {itemLabel}
        </VerticalMenuItem>
      )
    })
  }

  return <>{visibleMenuData && renderMenuItems(visibleMenuData)}</>
}

export const GenerateHorizontalMenu = ({ menuData }: { menuData: HorizontalMenuDataType[] }) => {
  const { locale } = useParams()

  const visibleMenuData = useMemo(
    () => excludeMenuRoutes(filterMenuForSidebar(menuData as any) as unknown as HorizontalMenuDataType[]),
    [menuData]
  )

  const renderMenuItems = (data: HorizontalMenuDataType[]) => {
    return data?.map((item: HorizontalMenuDataType, index) => {
      if (!isValidMenuItem(item) && !(item as any).isSection) return null

      const subMenuItem = item as HorizontalSubMenuDataType
      const menuItem = item as HorizontalMenuItemDataType
      const validChildren = getChildren(subMenuItem as any).filter(isValidMenuItem) as HorizontalMenuDataType[]
      const itemLabel = getMenuTitle(item, locale as string)

      if (validChildren.length > 0) {
        const { icon, prefix, suffix, label, ...rest } = subMenuItem as any

        return (
          <HorizontalSubMenu
            key={index}
            label={itemLabel}
            title={itemLabel || undefined}
            prefix={renderChipOrNode(prefix)}
            suffix={renderChipOrNode(suffix)}
            {...stripSubMenuLinkProps(stripNonDomProps(rest))}
            icon={<MenuIcon icon={icon || (subMenuItem as any).group_menu_icon || (subMenuItem as any).command_icon} size={20} />}
          >
            {renderMenuItems(validChildren)}
          </HorizontalSubMenu>
        )
      }

      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem as any
      const route = getMenuRoute(menuItem)
      const href = route?.startsWith('http')
        ? route
        : route && (excludeLang ? route : getLocalizedUrl(route, locale as Locale))

      return (
        <HorizontalMenuItem
          key={index}
          title={itemLabel || undefined}
          prefix={renderChipOrNode(prefix)}
          suffix={renderChipOrNode(suffix)}
          {...stripNonDomProps(rest)}
          href={href}
          icon={<MenuIcon icon={icon || (menuItem as any).group_menu_icon || (menuItem as any).command_icon} size={20} />}
        >
          {itemLabel}
        </HorizontalMenuItem>
      )
    })
  }

  return <>{renderMenuItems(visibleMenuData)}</>
}
