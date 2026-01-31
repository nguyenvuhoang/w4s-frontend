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
    root: ({ level }) => ({
      ...(!isPopoutWhenCollapsed || popoutExpanded || (popoutCollapsed && level === 0)
        ? {
          marginBlockStart: theme.spacing(2),
          color: 'rgba(255, 255, 255, 0.85) !important'
        }
        : {
          marginBlockStart: 0,
          color: 'rgba(255, 255, 255, 0.85) !important'
        }),
      [`&.${menuClasses.subMenuRoot}.${menuClasses.open} > .${menuClasses.button}, &.${menuClasses.subMenuRoot} > .${menuClasses.button}.${menuClasses.active}`]:
      {
        backgroundImage: 'linear-gradient(290deg, #EAF6FF 9.78%, #F3FFE9 109.56%) !important',
        color: '#066a4c !important'
      },
      [`&.${menuClasses.disabled} > .${menuClasses.button}`]: {
        color: 'rgba(255, 255, 255, 0.3) !important'
      },
      [`&:not(.${menuClasses.subMenuRoot}) > .${menuClasses.button}.${menuClasses.active}`]: {
        ...(popoutCollapsed && level > 0
          ? {
            backgroundImage: 'linear-gradient(290deg, #EAF6FF 9.78%, #F3FFE9 109.56%) !important',
            color: '#066a4c !important',
            [`& .${menuClasses.icon}`]: {
              color: 'var(--mui-palette-primary-main)'
            }
          }
          : {
            color: '#066a4c !important',
            backgroundImage: 'linear-gradient(290deg, #EAF6FF 9.78%, #F3FFE9 109.56%) !important',
            boxShadow: 'var(--mui-customShadows-xs)',
            [`& .${menuClasses.icon}`]: {
              color: '#066a4c !important'
            }
          })
      }
    }),
    button: ({ level, active }) => ({
      paddingBlock: '8px',
      ...(!active && {
        color: 'rgba(255, 255, 255, 0.85) !important',
        [`& .${menuClasses.icon}`]: {
          color: 'rgba(255, 255, 255, 0.85) !important'
        },
        [`& .${menuClasses.label}`]: {
          color: 'rgba(255, 255, 255, 0.85) !important'
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
          backgroundColor: 'var(--mui-palette-action-hover)'
        },
        '&[aria-expanded="true"]': {
          backgroundColor: 'var(--mui-palette-action-selected)'
        }
      })
    }),
    icon: ({ level }) => ({
      transition: `margin-inline-end ${transitionDuration}ms ease-in-out`,
      ...(level === 0 && {
        fontSize: '1.375rem',
        marginInlineEnd: theme.spacing(2),
        color: 'rgba(255, 255, 255, 0.85) !important'
      }),
      ...(level > 0 && {
        fontSize: '0.5rem',
        color: 'rgba(255, 255, 255, 0.6) !important',
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
    label: ({ level, active }) => ({
      color: active ? '#066a4c !important' : 'rgba(255, 255, 255, 0.85) !important',
      ...((!isPopoutWhenCollapsed || popoutExpanded || (popoutCollapsed && level === 0)) && {
        transition: `opacity ${transitionDuration}ms ease-in-out`,
        ...(collapsedNotHovered && {
          opacity: 0
        })
      })
    }),
    suffix: {
      marginInlineStart: theme.spacing(2)
    },
    subMenuExpandIcon: {
      fontSize: '1.375rem',
      marginInlineStart: theme.spacing(2),
      color: 'rgba(255, 255, 255, 0.7) !important',
      '& i, & svg': {
        fontSize: 'inherit'
      }
    },

    subMenuContent: ({ level }) => ({
      zIndex: 'calc(var(--drawer-z-index) + 1)',
      backgroundColor: popoutCollapsed ? 'var(--mui-palette-background-paper)' : 'transparent',
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
