'use client'

// Component Imports
import LanguageDropdown from '@components/layout/shared/LanguageDropdown';
// Util Imports
import ModeDropdown from '@components/layout/shared/ModeDropdown';
import UserDropdown from '@components/layout/shared/UserDropdown';
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses';
// Hook Imports
import { getLocalizedUrl } from '@/utils/i18n';
import Logo from '@components/layout/shared/Logo';
import useHorizontalNav from '@menu/hooks/useHorizontalNav';
// Type Imports
import type { Locale } from '@configs/i18n';
import { useParams } from 'next/navigation';
// Third-party Imports
import { Box } from '@mui/material';
import classnames from 'classnames';
// Next Imports
import Link from 'next/link';

import NavToggle from './NavToggle';
import { getDictionary } from '@/utils/getDictionary';


// Vars

const NavbarContent = ({ avatar, name, dictionary }: {
  avatar: string,
  name: string,
  dictionary: Awaited<ReturnType<typeof getDictionary>>
}) => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()
  const { locale } = useParams()

  return (
    <Box
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <Box className='flex items-center gap-4'>
        <NavToggle />
        {!isBreakpointReached && (
          <Link href={getLocalizedUrl('/', locale as Locale)}>
            <Logo />
          </Link>
        )}
      </Box>

      <Box className='flex items-center'>
        <LanguageDropdown />
        {/* <ModeDropdown /> */}
        <UserDropdown avatar={avatar} name={name} dictionary={dictionary} />
      </Box>
    </Box>
  )
}

export default NavbarContent
