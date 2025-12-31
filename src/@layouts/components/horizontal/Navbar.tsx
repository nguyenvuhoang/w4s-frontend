'use client'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Box } from '@mui/material'

const Navbar = ({ children }: ChildrenType) => {
  return (
    <Box className={classnames(horizontalLayoutClasses.navbar, 'flex items-center justify-between is-full')}>
      {children}
    </Box>
  )
}

export default Navbar
