'use client'

// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

// Component Imports
import LayoutHeader from '@layouts/components/horizontal/Header'
import Navbar from '@layouts/components/horizontal/Navbar'
import NavbarContent from './NavbarContent'
import Navigation from './Navigation'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'
import { getDictionary } from '@/utils/getDictionary'

const Header = ({ menu, avatar, name, dictionary }:
  {
    menu: HorizontalMenuDataType[]
    avatar: string
    name: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
  }) => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <>
      <LayoutHeader>
        <Navbar>
          <NavbarContent avatar={avatar} name={name} dictionary={dictionary} />
        </Navbar>
        {!isBreakpointReached && <Navigation menu={menu} />}
      </LayoutHeader>
      {isBreakpointReached && <Navigation menu={menu} />}
    </>
  )
}

export default Header
