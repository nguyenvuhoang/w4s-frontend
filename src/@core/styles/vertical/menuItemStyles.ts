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
          marginBlockStart: level === 0 ? theme.spacing(1) : theme.spacing(0.5),
          color: (active || (rest as any).open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        }
        : {
          marginBlockStart: 0,
          color: (active || (rest as any).open) ? 'var(--mui-palette-primary-main) !important' : 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important'
        }),
      transition: 'all 0.3s ease !important',
      [`&.${menuClasses.subMenuRoot}.${menuClasses.open} > .${menuClasses.button}, &.${menuClasses.subMenuRoot} > .${menuClasses.button}.${menuClasses.active}`]:
      {
        backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #EAFBFF 54%, #E9FFF5 100%) !important',
        color: '#0F5F74 !important',
        borderRadius: '14px !important',
        marginInline: '10px !important',
        boxShadow: '0px 8px 22px rgba(0, 0, 0, 0.16) !important',
        [`& .${menuClasses.icon}`]: {
          color: '#0F6F7F !important',
          background: 'linear-gradient(135deg, rgba(34, 80, 135, 0.16), rgba(0, 188, 212, 0.18)) !important',
          boxShadow: '0 4px 12px rgba(15, 111, 127, 0.18)'
        },
        [`& .${menuClasses.label}`]: {
          color: '#0F5F74 !important'
        }
      },
      [`&.${menuClasses.disabled} > .${menuClasses.button}`]: {
        color: 'rgba(255, 255, 255, 0.3) !important'
      },
      [`&:not(.${menuClasses.subMenuRoot}) > .${menuClasses.button}.${menuClasses.active}`]: {
        ...(popoutCollapsed && level > 0
          ? {
            backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #EAFBFF 54%, #E9FFF5 100%) !important',
            color: '#0F5F74 !important',
            borderRadius: '16px !important',
            marginInline: '12px !important',
            [`& .${menuClasses.icon}`]: {
              color: '#0F6F7F !important',
              background: 'linear-gradient(135deg, rgba(34, 80, 135, 0.16), rgba(0, 188, 212, 0.18)) !important'
            }
          }
          : {
            color: '#0F5F74 !important',
            backgroundImage: 'linear-gradient(90deg, #FFFFFF 0%, #EAFBFF 54%, #E9FFF5 100%) !important',
            boxShadow: level === 0 ? '0px 8px 22px rgba(0, 0, 0, 0.16) !important' : 'none',
            borderRadius: '14px !important',
            marginInline: level === 0 ? '10px !important' : '14px 10px 6px 18px !important',
            [`& .${menuClasses.icon}`]: {
              color: '#0F6F7F !important',
              background: 'linear-gradient(135deg, rgba(34, 80, 135, 0.16), rgba(0, 188, 212, 0.18)) !important',
              boxShadow: '0 4px 12px rgba(15, 111, 127, 0.18)'
            },
            [`& .${menuClasses.label}`]: {
              color: '#0F5F74 !important'
            }
          })
      }
    }),
    button: ({ level, active, ...rest }) => ({
      paddingBlock: level === 0 ? '10px' : '8px',
      transition: 'all 0.2s ease-in-out !important',
      ...(!active && !(rest as any).open && {
        color: 'var(--menu-inactive-color, rgba(255, 255, 255, 0.85)) !important',
        [`& .${menuClasses.icon}`]: {
          color: '#FFFFFF !important'
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
        paddingInlineStart: collapsedNotHovered
          ? theme.spacing(((collapsedWidth as number) - 47) / 8)
          : theme.spacing(level === 0 ? 3 : 5.5),
        paddingInlineEnd: theme.spacing(collapsedNotHovered ? ((collapsedWidth as number) - 47) / 8 : 3)
      }),
      ...(!active && {
        '&:hover, &:focus-visible': {
          backgroundColor: level === 0 ? 'rgba(255, 255, 255, 0.12) !important' : 'rgba(255, 255, 255, 0.08) !important',
          transform: level === 0 ? 'translateX(2px)' : 'none',
          [`& .${menuClasses.icon}`]: {
            backgroundColor: 'rgba(255, 255, 255, 0.24) !important',
            boxShadow: '0 5px 14px rgba(255, 255, 255, 0.12)'
          },
          [`& .${menuClasses.label}`]: {
            color: '#FFFFFF !important'
          }
        },
        '&[aria-expanded="true"]': {
          backgroundColor: 'var(--mui-palette-action-selected)'
        }
      })
    }),
    icon: ({ level }) => ({
      transition: theme.transitions.create(['margin-inline-end', 'background-color', 'box-shadow', 'color', 'transform'], {
        duration: transitionDuration,
        easing: 'ease-in-out'
      }),
      color: '#FFFFFF !important',
      inlineSize: level === 0 ? 34 : 26,
      blockSize: level === 0 ? 34 : 26,
      borderRadius: 999,
      backgroundColor: level === 0 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.10)',
      boxShadow: level === 0 ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)' : 'none',
      ...(level === 0 && {
        fontSize: '1.15rem',
        marginInlineEnd: theme.spacing(2)
      }),
      ...(level > 0 && {
        fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.86) !important',
        marginInlineEnd: theme.spacing(2.5)
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
        fontSize: 'inherit',
        color: 'inherit'
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
      transition: `color ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out`,
      '& i, & svg': {
        fontSize: 'inherit'
      }
    }),

    subMenuContent: ({ level }) => ({
      zIndex: 'calc(var(--drawer-z-index) + 1)',
      backgroundColor: popoutCollapsed ? 'var(--mui-palette-background-paper)' : 'transparent',
      paddingBlock: level === 0 ? '6px' : '3px',
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
