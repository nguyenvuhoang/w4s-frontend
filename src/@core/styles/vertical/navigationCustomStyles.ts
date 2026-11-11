// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { VerticalNavState } from '@menu/contexts/verticalNavContext'

// Util Imports
import { menuClasses, verticalNavClasses } from '@menu/utils/menuClasses'

const navigationCustomStyles = (verticalNavOptions: VerticalNavState, theme: Theme) => {
  // Vars
  const { isCollapsed, isHovered, collapsedWidth, transitionDuration } = verticalNavOptions

  const collapsedHovered = isCollapsed && isHovered

  const collapsedNotHovered = isCollapsed && !isHovered

  return {
    color: '#fff',
    zIndex: 'var(--drawer-z-index) !important',
    [`& .${verticalNavClasses.header}`]: {
      paddingBlock: theme.spacing(5),
      paddingInline: theme.spacing(5.5, 4),
      ...(collapsedNotHovered && {
        justifyContent: 'center',
        paddingBlock: theme.spacing(3),
        paddingInline: theme.spacing(1),
        '& a': {
          transform: 'none'
        }
      }),
      '& a': {
        transition: `transform ${transitionDuration}ms ease`
      }
    },
    [`& .${verticalNavClasses.container}`]: {
      transition: theme.transitions.create(['inline-size', 'inset-inline-start', 'box-shadow'], {
        duration: transitionDuration,
        easing: 'ease-in-out'
      }),
      borderColor: 'transparent',
      ...(collapsedHovered && {
        boxShadow: 'var(--mui-customShadows-lg)'
      }),
      [`& .${verticalNavClasses.toggled}`]: {
        boxShadow: 'var(--mui-customShadows-lg)'
      },
      '[data-skin="bordered"] &': {
        borderColor: 'var(--mui-palette-divider)'
      }
    },

    [`& .${verticalNavClasses.header} > span svg`]: {
      transition: `transform ${transitionDuration}ms ease-in-out`,

      transform: `rotate(${collapsedHovered ? '180deg' : '0deg'})`,
      '[dir="rtl"] &': {
        transform: `rotate(${collapsedHovered ? '0deg' : '180deg'})`
      }
    },
    [`& .${menuClasses.menuSectionContent}`]: {
      color: 'rgba(255, 255, 255, 0.5)'
    },
    [`& .${menuClasses.root}`]: {
      paddingBlock: theme.spacing(1),
      paddingInline: collapsedNotHovered ? 0 : theme.spacing(3),
      ...(collapsedNotHovered && {
        [`& .${menuClasses.button}`]: {
          justifyContent: 'center',
          paddingInline: '0 !important'
        },
        [`& .${menuClasses.label}, & .${menuClasses.prefix}, & .${menuClasses.suffix}, & .${menuClasses.subMenuExpandIcon}`]:
          {
            display: 'none !important'
          },
        [`& .${menuClasses.icon}`]: {
          marginInline: '0 !important'
        }
      })
    },
    [`& .${verticalNavClasses.backdrop}`]: {
      backgroundColor: 'var(--backdrop-color)'
    }
  }
}

export default navigationCustomStyles
