// Third-party Imports
import classnames from 'classnames'

// Type Imports

// Component Imports
import LanguageDropdown from '@components/layout/shared/LanguageDropdown'
import ModeDropdown from '@components/layout/shared/ModeDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import Logout from '../shared/Logout'



const NavbarContent = () => {
  return (
    <>
      <div className='absolute top-0 right-0 flex items-center z-10 pt-4 pr-10'>
        <LanguageDropdown />
        <ModeDropdown />
        {/* <NotificationsDropdown notifications={notifications} /> */}
        <Logout />
      </div>

      <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-6 is-full relative')}>

      </div>

    </>
  )
}

export default NavbarContent
