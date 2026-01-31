// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Box } from '@mui/material'
import AISearch from '../shared/AISearch'

interface Props {
  menuData?: any[]
}

const NavbarContent = ({ menuData }: Props) => {
  return (
    <>
      <Box className='absolute top-0 right-0 flex items-center z-10 pt-4 pr-10'>
        {/* Components moved to vertical menu */}
      </Box>

      <Box className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-6 is-full relative')}>
        <AISearch menuData={menuData || []} />
      </Box>
    </>
  )
}

export default NavbarContent
