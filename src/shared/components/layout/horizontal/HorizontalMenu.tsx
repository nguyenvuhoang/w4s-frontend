// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import { GenerateHorizontalMenu } from '@components/GenerateMenu'
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'

// Menu Data Imports
import type { HorizontalMenuDataType } from '@shared/types/menuTypes'
import { Box } from '@mui/material'
import React from 'react'
import { useHorizontalWheelScroll } from './useHorizontalWheelScroll'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => {
  return (
    <StyledHorizontalNavExpandIcon level={level}>
      <i className='ri-arrow-right-s-line text-primary' />
    </StyledHorizontalNavExpandIcon>
  )
}
const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line text-primary' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = ({ menu }: {
  menu: HorizontalMenuDataType[]
}) => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()

  // Vars
  const { transitionDuration } = verticalNavOptions
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  useHorizontalWheelScroll(wrapperRef)

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-default)'
      }}
    >
      <Box ref={wrapperRef} style={{ minWidth: 0 }}>
        <Menu
          rootStyles={menuRootStyles(theme)}
          renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
          renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
          menuItemStyles={menuItemStyles(theme, 'ri-circle-fill')}
          popoutMenuOffset={{
            mainAxis: ({ level }) => (level && level > 0 ? 4 : 14),
            alignmentAxis: 0
          }}
          verticalMenuProps={{
            menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
            renderExpandIcon: ({ open }) => (
              <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
            ),
            renderExpandedMenuItemIcon: { icon: <i className='ri-circle-fill' /> }
          }}
        >
          <GenerateHorizontalMenu menuData={menu} />
        </Menu>
      </Box>
    </HorizontalNav>
  )
}

export default HorizontalMenu

