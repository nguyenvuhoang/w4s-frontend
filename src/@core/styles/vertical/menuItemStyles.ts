// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { MenuItemStyles } from '@menu/types'
import type { VerticalNavState } from '@menu/contexts/verticalNavContext'

// Util Imports
import { menuClasses } from '@menu/utils/menuClasses'

const menuItemStyles = (verticalNavOptions: VerticalNavState, theme: Theme): MenuItemStyles => {
  // Vars
  const { isCollapsed, collapsedWidth, isHovered, isPopoutWhenCollapsed, transitionDuration } = verticalNavOptions

  const popoutCollapsed = isPopoutWhenCollapsed && isCollapsed
  const popoutExpanded = isPopoutWhenCollapsed && !isCollapsed
  const collapsedNotHovered = isCollapsed && !isHovered

  return {
    root: ({ level, active, ...rest }) => ({
      ...(!isPopoutWhenCollapsed || popoutExpanded || (popoutCollapsed && level === 0)
        ? {
          marginBlockStart: '4px',
          color: (active || (rest as any).open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        }
        : {
          marginBlockStart: 0,
          color: (active || (rest as any).open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        }),
      transition: 'all 0.3s ease !important',
      [`&.${menuClasses.subMenuRoot}.${menuClasses.open} > .${menuClasses.button}, &.${menuClasses.subMenuRoot} > .${menuClasses.button}.${menuClasses.active}`]:
      {
        backgroundImage: 'linear-gradient(90deg, #EAF6FF 0%, #F3FFE9 100%) !important',
        color: 'var(--mui-palette-primary-main) !important',
        borderRadius: '16px !important',
        marginInline: '12px !important',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05) !important',
        [`& .${menuClasses.icon}`]: {
          color: 'var(--mui-palette-primary-main) !important'
        },
        [`& .${menuClasses.label}`]: {
          color: 'var(--mui-palette-primary-main) !important'
        }
      },
      [`&.${menuClasses.disabled} > .${menuClasses.button}`]: {
        color: 'rgba(255, 255, 255, 0.3) !important'
      },
      [`&:not(.${menuClasses.subMenuRoot}) > .${menuClasses.button}.${menuClasses.active}`]: {
        ...(popoutCollapsed && level > 0
          ? {
            backgroundImage: 'linear-gradient(90deg, #EAF6FF 0%, #F3FFE9 100%) !important',
            color: 'var(--mui-palette-primary-main) !important',
            borderRadius: '16px !important',
            marginInline: '12px !important',
            [`& .${menuClasses.icon}`]: {
              color: 'var(--mui-palette-primary-main)'
            }
          }
          : {
            color: 'var(--mui-palette-primary-main) !important',
            backgroundImage: 'linear-gradient(90deg, #EAF6FF 0%, #F3FFE9 100%) !important',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1) !important',
            borderRadius: '16px !important',
            marginInline: '12px !important',
            [`& .${menuClasses.icon}`]: {
              color: 'var(--mui-palette-primary-main) !important'
            }
          })
      }
    }),
    button: ({ level, active, ...rest }) => ({
      paddingBlock: '10px',
      transition: 'all 0.2s ease-in-out !important',
      ...(!active && !(rest as any).open && {
        color: 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important',
        [`& .${menuClasses.icon}`]: {
          color: 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        },
        [`& .${menuClasses.label}`]: {
          color: 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        }
      }),
      ...(!(isCollapsed && !isHovered) && {
        '&:has(.MuiChip-root)': {
          paddingBlock: theme.spacing(2)
        }
      }),
      ...((!isPopoutWhenCollapsed || popoutExpanded || (popoutCollapsed && level === 0)) && {
        borderRadius: 'var(--mui-shape-customBorderRadius-lg)',
        transition: `padding-inline-start ${transitionDuration}ms ease-in-out`,
        paddingInlineStart: theme.spacing(collapsedNotHovered ? ((collapsedWidth as number) - 47) / 8 : 3),
        paddingInlineEnd: theme.spacing(collapsedNotHovered ? ((collapsedWidth as number) - 47) / 8 : 3)
      }),
      ...(!active && {
        '&:hover, &:focus-visible': {
          backgroundColor: 'rgba(255, 255, 255, 0.08) !important'
        },
        '&[aria-expanded="true"]': {
          backgroundColor: 'var(--mui-palette-action-selected)'
        }
      })
    }),
    icon: ({ level }) => ({
      transition: `margin-inline-end ${transitionDuration}ms ease-in-out`,
      color: 'rgba(255, 255, 255, 0.85) !important',
      ...(level === 0 && {
        fontSize: '1.375rem',
        marginInlineEnd: theme.spacing(2)
      }),
      ...(level > 0 && {
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.7) !important',
        marginInlineEnd: theme.spacing(4)
      }),
      ...(level === 1 &&
        !popoutCollapsed && {
        marginInlineStart: theme.spacing(1.5)
      }),
      ...(level > 1 && {
        marginInlineStart: theme.spacing((popoutCollapsed ? 0 : 1.5) + 2.5 * (level - 1))
      }),
      ...(collapsedNotHovered && {
        marginInlineEnd: 0
      }),
      ...(popoutCollapsed &&
        level > 0 && {
        marginInlineEnd: theme.spacing(2)
      }),
      '& > i, & > svg': {
        fontSize: 'inherit'
      }
    }),
    prefix: {
      marginInlineEnd: theme.spacing(2)
    },
    label: ({ level, active, ...rest }) => ({
      color: (active || (rest as any).open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important',
      fontWeight: (active || (rest as any).open) ? 600 : 400,
      ...((!isPopoutWhenCollapsed || popoutExpanded || (popoutCollapsed && level === 0)) && {
        transition: `opacity ${transitionDuration}ms ease-in-out`,
        ...(((rest as any).collapsedNotHovered || collapsedNotHovered) && !active && !(rest as any).open && {
          opacity: 0
        })
      })
    }),
    suffix: {
      marginInlineStart: theme.spacing(2)
    },
    subMenuExpandIcon: ({ active, open }) => ({
      fontSize: '1.375rem',
      marginInlineStart: theme.spacing(2),
      color: (active || open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.7)) !important',
      '& i, & svg': {
        fontSize: 'inherit'
      }
    }),

    subMenuContent: ({ level }) => ({
      zIndex: 'calc(var(--drawer-z-index) + 1)',
      backgroundColor: popoutCollapsed ? 'var(--mui-palette-background-paper)' : 'transparent',
      paddingBlock: '4px',
      ...(popoutCollapsed &&
        level === 0 && {
        paddingBlock: theme.spacing(2),
        borderRadius: 'var(--mui-shape-borderRadius)',
        boxShadow: 'var(--mui-customShadows-lg)',
        '[data-skin="bordered"] &': {
          boxShadow: 'none',
          border: '1px solid var(--mui-palette-divider)'
        },
        [`& .${menuClasses.button}`]: {
          paddingInline: theme.spacing(4)
        }
      })
    })
  }
}

export default menuItemStyles
