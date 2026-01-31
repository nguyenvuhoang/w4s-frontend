// Component Imports
import LayoutNavbar from '@layouts/components/vertical/Navbar'
import NavbarContent from './NavbarContent'

const Navbar = ({ menuData }: { menuData?: any[] }) => {
  return (
    <LayoutNavbar>
      <NavbarContent menuData={menuData} />
    </LayoutNavbar>
  )
}

export default Navbar
