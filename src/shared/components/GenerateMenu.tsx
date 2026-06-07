// React Imports
import { useId, useState } from 'react'
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
  return node && (node as ChipProps).label ? <Chip size='small' {...(node as ChipProps)} /> : (node as ReactNode)
}

export const GenerateVerticalMenu = ({
  menuData,
  onMenuItemClick,
  activeItem
}: {
  menuData: VerticalMenuDataType[]
  onMenuItemClick?: (item: VerticalSubMenuDataType) => void
  activeItem?: VerticalSubMenuDataType | null
}) => {
  const { locale } = useParams()
  const pathname = usePathname()

  const isSameMenuItem = (left: any, right: any) => {
    if (!left || !right) return false

    return Boolean(
      (left.id && right.id && left.id === right.id) ||
      (left.command_id && right.command_id && left.command_id === right.command_id) ||
      (left.label && right.label && left.label === right.label)
    )
  }

  const hasActiveChildRoute = (item: any): boolean => {
    return getChildren(item).some((child: any) => {
      const route = child.href || child.command_uri || child.command_url
      const localizedRoute = route?.startsWith('http') ? route : route && getLocalizedUrl(route, locale as Locale)

      if (localizedRoute && pathname === localizedRoute) return true

      return hasActiveChildRoute(child)
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

      if (itemChildren.length > 0) {
        const { icon, prefix, suffix, ...rest } = subMenuItem as any
        const parentActive = isSameMenuItem(subMenuItem, activeItem) || hasActiveChildRoute(subMenuItem)

        return (
          <VerticalMenuItem
            key={index}
            title={typeof subMenuItem.label === 'string' ? subMenuItem.label : undefined}
            prefix={renderChipOrNode(prefix)}
            suffix={renderChipOrNode(suffix)}
            active={parentActive}
            onClick={(event: any) => {
              event.preventDefault()
              onMenuItemClick?.(subMenuItem)
            }}
            {...stripSubMenuLinkProps(stripNonDomProps(rest))}
            icon={<MenuIcon icon={icon} size={20} color='currentColor' />}
          >
            {subMenuItem.label}
          </VerticalMenuItem>
        )
      }

      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem as any
      const href = rest.href?.startsWith('http')
        ? rest.href
        : rest.href && (excludeLang ? rest.href : getLocalizedUrl(rest.href, locale as Locale))

      return (
        <VerticalMenuItem
          key={index}
          title={typeof label === 'string' ? label : undefined}
          prefix={renderChipOrNode(prefix)}
          suffix={renderChipOrNode(suffix)}
          {...stripNonDomProps(rest)}
          href={href}
          icon={<MenuIcon icon={icon} size={20} color='currentColor' />}
        >
          {label}
        </VerticalMenuItem>
      )
    })
  }

  return <>{menuData && renderMenuItems(menuData)}</>
}

export const GenerateHorizontalMenu = ({ menuData }: { menuData: HorizontalMenuDataType[] }) => {
  const { locale } = useParams()

  const renderMenuItems = (data: HorizontalMenuDataType[]) => {
    return data?.map((item: HorizontalMenuDataType, index) => {
      if (!isValidMenuItem(item) && !(item as any).isSection) return null

      const subMenuItem = item as HorizontalSubMenuDataType
      const menuItem = item as HorizontalMenuItemDataType
      const validChildren = getChildren(subMenuItem as any).filter(isValidMenuItem) as HorizontalMenuDataType[]

      if (validChildren.length > 0) {
        const { icon, prefix, suffix, ...rest } = subMenuItem as any

        return (
          <HorizontalSubMenu
            key={index}
            title={typeof subMenuItem.label === 'string' ? subMenuItem.label : undefined}
            prefix={renderChipOrNode(prefix)}
            suffix={renderChipOrNode(suffix)}
            {...stripSubMenuLinkProps(stripNonDomProps(rest))}
            icon={<MenuIcon icon={icon} size={20} />}
          >
            {renderMenuItems(validChildren)}
          </HorizontalSubMenu>
        )
      }

      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem as any
      const href = rest.href?.startsWith('http')
        ? rest.href
        : rest.href && (excludeLang ? rest.href : getLocalizedUrl(rest.href, locale as Locale))

      return (
        <HorizontalMenuItem
          key={index}
          title={typeof label === 'string' ? label : undefined}
          prefix={renderChipOrNode(prefix)}
          suffix={renderChipOrNode(suffix)}
          {...stripNonDomProps(rest)}
          href={href}
          icon={<MenuIcon icon={icon} size={20} />}
        >
          {label}
        </HorizontalMenuItem>
      )
    })
  }

  return <>{renderMenuItems(menuData)}</>
}
