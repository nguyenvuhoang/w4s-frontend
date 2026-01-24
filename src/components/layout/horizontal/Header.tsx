'use client'

// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

// Component Imports
import LayoutHeader from '@layouts/components/horizontal/Header'
import Navbar from '@layouts/components/horizontal/Navbar'
import NavbarContent from './NavbarContent'
import Navigation from './Navigation'

// Hook Imports
import { RoleChannel } from '@/types/systemTypes'
import { getDictionary } from '@/utils/getDictionary'
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

const Header = ({ menu, avatar, name, dictionary, roleChannel }:
  {
    menu: HorizontalMenuDataType[]
    avatar: string
    name: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    roleChannel: RoleChannel[]
  }) => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <>
      <LayoutHeader>
        <Navbar>
          <NavbarContent avatar={avatar} name={name} dictionary={dictionary} roleChannel={roleChannel} />
        </Navbar>
        {!isBreakpointReached && <Navigation menu={menu} />}
      </LayoutHeader>
      {isBreakpointReached && <Navigation menu={menu} />}
    </>
  )
}

export default Header
