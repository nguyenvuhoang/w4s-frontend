// Component Imports
import LayoutNavbar from '@layouts/components/vertical/Navbar'
import NavbarContent from './NavbarContent'

const Navbar = ({ menuData, dictionary }: { menuData?: any[]; dictionary?: any }) => {
  return (
    <LayoutNavbar>
      <NavbarContent menuData={menuData} dictionary={dictionary} />
    </LayoutNavbar>
  )
}

export default Navbar
