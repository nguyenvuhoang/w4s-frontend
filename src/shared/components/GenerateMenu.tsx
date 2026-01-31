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
} from '@shared/types/menuTypes';
import type { Locale } from '@configs/i18n';

// Component Imports
import { MenuItem as HorizontalMenuItem, SubMenu as HorizontalSubMenu } from '@menu/horizontal-menu';
import { MenuSection, MenuItem as VerticalMenuItem, SubMenu as VerticalSubMenu } from '@menu/vertical-menu';

// Util Imports
import { getLocalizedUrl } from '@utils/i18n';

// Generate Vertical menu from the menu data array
export const GenerateVerticalMenu = ({ menuData, onMenuItemClick, activeItem }: { menuData: VerticalMenuDataType[], onMenuItemClick?: (item: VerticalSubMenuDataType) => void, activeItem?: VerticalSubMenuDataType | null }) => {
  // Hooks
  const { locale } = useParams()

  const renderMenuItems = (data: VerticalMenuDataType[] | unknown) => {
    // Use the map method to iterate through the array of menu data
    return (data as VerticalMenuDataType[]).map((item: VerticalMenuDataType, index: number) => {
      // ❗ Skip non-menu items (Case-insensitive check for 'M')
      const commandType = (item as any).command_type || (item as any).commandType;
      if (typeof commandType === 'string' && commandType.toUpperCase() !== 'M' && commandType !== '') return null;
      if (!commandType && !(item as any).isSection) return null; // Fallback for sections or items missing explicitly defined type

      const menuSectionItem = item as VerticalSectionDataType
      const subMenuItem = item as VerticalSubMenuDataType
      const menuItem = item as VerticalMenuItemDataType

      // Check if the current item is a section
      if (menuSectionItem.isSection) {
        // Prop destructuring to remove non-DOM and internal props from being spread to the DOM
        const { children, isSection, command_type, workflow_id, is_active, parent_id, ...validRest } = menuSectionItem as any;

        // If it is, return
        return (
          <MenuSection key={index} {...validRest}>
            {children && renderMenuItems(children)}
          </MenuSection>
        )
      }

      // Check if the current item is a sub menu (handle different children property names)
      const itemChildren = subMenuItem.children || (subMenuItem as any).items || (subMenuItem as any).submenus;
      if (itemChildren && Array.isArray(itemChildren) && itemChildren.length > 0) {
        // Filter valid children (command_type === 'M' or missing type)
        const validChildren = itemChildren.filter((c: any) => {
          const cType = c.command_type || c.commandType;
          return !cType || cType.toUpperCase() === 'M';
        });

        // ❗ Skip rendering this submenu if no valid children
        if (validChildren.length === 0) return null;

        // Prop destructuring to remove non-DOM and internal props from being spread to the DOM
        const {
          active: dataActive,
          open: dataOpen,
          children: dataChildren,
          icon, prefix, suffix, href, command_type, isSection, workflow_id, is_active, parent_id, is_agreement, is_required, is_check_permission, is_external,
          ...validRest
        } = subMenuItem as any;

        const DynamicIcon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.AccountBalance;

        const subMenuSuffix: ReactNode =
          suffix && (suffix as ChipProps).label ? (
            <Chip size="small" {...(suffix as ChipProps)} />
          ) : (
            suffix as ReactNode
          );

        // Safety check for active state: match by ID or Label, but ensure both exist
        const isOpen = activeItem && (
          (subMenuItem.id && activeItem.id === subMenuItem.id) ||
          (subMenuItem.label && activeItem.label === subMenuItem.label)
        );

        // Render as a MenuItem instead of SubMenu to prevent accordion effect
        // but still pass the children to the side panel via onClick
        return (
          <VerticalMenuItem
            key={index}
            suffix={subMenuSuffix}
            {...validRest}
            active={!!isOpen}
            onClick={(e: any) => {
              e.preventDefault();
              onMenuItemClick?.(subMenuItem);
            }}
            {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 24, color: "inherit" }} /> })}
          >
            {subMenuItem.label}
          </VerticalMenuItem>
        );
      }


      // If the current item is neither a section nor a sub menu, return a MenuItem component
      const {
        label,
        active: dataActive,
        open: dataOpen,
        children: dataChildren,
        excludeLang, icon, prefix, suffix, command_type, isSection, workflow_id, is_active, parent_id, is_agreement, is_required, is_check_permission, is_external, ...validRest
      } = menuItem as any;

      // Localize the href
      const href = validRest.href?.startsWith('http')
        ? validRest.href
        : validRest.href && (excludeLang ? validRest.href : getLocalizedUrl(validRest.href, locale as Locale))

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
          {...validRest}
          href={href}
          {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 24, color: "inherit" }} /> })}
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
      // Skip if not menu (Case-insensitive check for 'M')
      const commandType = (item as any).command_type || (item as any).commandType;
      if (typeof commandType === 'string' && commandType.toUpperCase() !== 'M' && commandType !== '') return null;
      if (!commandType && !(item as any).isSection) return null;

      const subMenuItem = item as HorizontalSubMenuDataType;
      const menuItem = item as HorizontalMenuItemDataType;

      // 👉 Only continue if item has valid children (handle alternate property names)
      const rawChildren = subMenuItem.children || (subMenuItem as any).items || (subMenuItem as any).submenus || [];
      const validChildren = rawChildren.filter((c: any) => {
        const cType = c.command_type || c.commandType;
        return !cType || cType.toUpperCase() === 'M';
      });

      // ✅ If it has children (submenu case)
      if (validChildren.length > 0) {
        // Prop destructuring to remove non-DOM and internal props
        const { active: dataActive, open: dataOpen, children: dataChildren, icon, prefix, suffix, command_type, isSection, workflow_id, is_active, parent_id, ...validRest } = subMenuItem as any;

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
            {...validRest}
            {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 24, color: "inherit" }} /> })}
          >
            {renderMenuItems(validChildren)}
          </HorizontalSubMenu>
        );
      }

      // 🧾 Otherwise, treat it as a normal menu item (no children)
      const { label, active: dataActive, open: dataOpen, children: dataChildren, excludeLang, icon, prefix, suffix, command_type, isSection, workflow_id, is_active, parent_id, ...validRest } = menuItem as any;

      const href = validRest.href?.startsWith("http")
        ? validRest.href
        : validRest.href && (excludeLang ? validRest.href : getLocalizedUrl(validRest.href, locale as Locale));

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
          {...validRest}
          href={href}
          {...(DynamicIcon && { icon: <DynamicIcon sx={{ fontSize: 24, color: "inherit" }} /> })}
        >
          {label}
        </HorizontalMenuItem>
      );
    });
  };


  return <>{renderMenuItems(menuData)}</>
}

