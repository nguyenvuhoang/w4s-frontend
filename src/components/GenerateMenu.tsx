// React Imports
import type { ReactNode } from 'react';

// Next Imports
import { useParams } from 'next/navigation';

// MUI Imports
import * as Icons from '@mui/icons-material';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';

// Type Imports
import type {
  HorizontalMenuDataType,
  HorizontalMenuItemDataType,
  HorizontalSubMenuDataType,
  VerticalMenuDataType,
  VerticalMenuItemDataType,
  VerticalSectionDataType,
  VerticalSubMenuDataType
} from '@/types/menuTypes';
import type { Locale } from '@configs/i18n';

// Component Imports
import { MenuItem as HorizontalMenuItem, SubMenu as HorizontalSubMenu } from '@menu/horizontal-menu';
import { MenuSection, MenuItem as VerticalMenuItem, SubMenu as VerticalSubMenu } from '@menu/vertical-menu';

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n';

// Generate Vertical menu from the menu data array
export const GenerateVerticalMenu = ({ menuData, onMenuItemClick }: { menuData: VerticalMenuDataType[], onMenuItemClick?: (item: VerticalSubMenuDataType) => void }) => {
  // Hooks
  const { locale } = useParams()

  const renderMenuItems = (data: VerticalMenuDataType[] | unknown) => {
    // Use the map method to iterate through the array of menu data
    return (data as VerticalMenuDataType[]).map((item: VerticalMenuDataType, index: number) => {
      // ❗ Skip non-menu items
      if ((item as any).commandType !== 'M') return null;

      const menuSectionItem = item as VerticalSectionDataType
      const subMenuItem = item as VerticalSubMenuDataType
      const menuItem = item as VerticalMenuItemDataType

      // Check if the current item is a section
      if (menuSectionItem.isSection) {
        const { children, isSection, ...rest } = menuSectionItem

        // If it is, return a MenuSection component and call generateMenu with the current menuSectionItem's children
        return (
          <MenuSection key={index} {...rest}>
            {children && renderMenuItems(children)}
          </MenuSection>
        )
      }

      // Check if the current item is a sub menu
      if (subMenuItem.children) {
        // Filter valid children (command_type === 'M')
        const validChildren = subMenuItem.children.filter((c: any) => c.command_type === 'M');

        // ❗ Skip rendering this submenu if no valid children
        if (validChildren.length === 0) return null;

        const { icon, prefix, suffix, ...rest } = subMenuItem;

        const DynamicIcon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.AccountBalance;

        const subMenuSuffix: ReactNode =
          suffix && (suffix as ChipProps).label ? (
            <Chip size="small" {...(suffix as ChipProps)} />
          ) : (
            suffix as ReactNode
          );

        return (
          <HorizontalSubMenu
            key={index}
            suffix={subMenuSuffix}
            {...rest}
            {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 50, color: "#225087" }} /> })}
          >
            {renderMenuItems(validChildren)}
          </HorizontalSubMenu>
        );
      }


      // If the current item is neither a section nor a sub menu, return a MenuItem component
      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem

      // Localize the href
      const href = rest.href?.startsWith('http')
        ? rest.href
        : rest.href && (excludeLang ? rest.href : getLocalizedUrl(rest.href, locale as Locale))

      const DynamicIcon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.AccountBalance;

      const menuItemPrefix: ReactNode =
        prefix && (prefix as ChipProps).label ? <Chip size='small' {...(prefix as ChipProps)} /> : (prefix as ReactNode)

      const menuItemSuffix: ReactNode =
        suffix && (suffix as ChipProps).label ? <Chip size='small' {...(suffix as ChipProps)} /> : (suffix as ReactNode)

      return (
        <VerticalMenuItem
          key={index}
          prefix={menuItemPrefix}
          suffix={menuItemSuffix}
          {...rest}
          href={href}
          {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 40, color: "#225087" }} /> })}
        >
          {label}
        </VerticalMenuItem>
      )
    })
  }

  return (
    <>
      {menuData && renderMenuItems(menuData)}
    </>
  )
}

// Generate Horizontal menu from the menu data array
export const GenerateHorizontalMenu = ({ menuData }: { menuData: HorizontalMenuDataType[] }) => {
  // Hooks
  const { locale } = useParams()

  const renderMenuItems = (data: HorizontalMenuDataType[]) => {
    return data?.map((item: HorizontalMenuDataType, index) => {
      // Skip if not menu
      if ((item as any).command_type !== 'M') return null;

      const subMenuItem = item as HorizontalSubMenuDataType;
      const menuItem = item as HorizontalMenuItemDataType;

      // 👉 Only continue if item has valid children
      const rawChildren = subMenuItem.children ?? [];
      const validChildren = rawChildren.filter((c: any) => c.command_type === 'M');

      // ✅ If it has children (submenu case)
      if (validChildren.length > 0) {
        const { icon, prefix, suffix, ...rest } = subMenuItem;

        const DynamicIcon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.AccountBalance;

        const subMenuSuffix: ReactNode =
          suffix && (suffix as ChipProps).label ? (
            <Chip size="small" {...(suffix as ChipProps)} />
          ) : (
            suffix as ReactNode
          );

        return (
          <HorizontalSubMenu
            key={index}
            suffix={subMenuSuffix}
            {...rest}
            {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 50, color: "#225087" }} /> })}
          >
            {renderMenuItems(validChildren)}
          </HorizontalSubMenu>
        );
      }

      // 🧾 Otherwise, treat it as a normal menu item (no children)
      const { label, excludeLang, icon, prefix, suffix, ...rest } = menuItem;

      const href = rest.href?.startsWith("http")
        ? rest.href
        : rest.href && (excludeLang ? rest.href : getLocalizedUrl(rest.href, locale as Locale));

      const DynamicIcon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.AccountBalance;

      const menuItemSuffix: ReactNode =
        suffix && (suffix as ChipProps).label ? (
          <Chip size="small" {...(suffix as ChipProps)} />
        ) : (
          suffix as ReactNode
        );

      return (
        <HorizontalMenuItem
          key={index}
          suffix={menuItemSuffix}
          {...rest}
          href={href}
          {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 40, color: "#225087" }} /> })}
        >
          {label}
        </HorizontalMenuItem>
      );
    });
  };


  return <>{renderMenuItems(menuData)}</>
}
