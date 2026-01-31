'use client'

// Component Imports
import LanguageDropdown from '@components/layout/shared/LanguageDropdown';
// Util Imports
import LayoutToggle from '@components/layout/shared/LayoutToggle';
import UserDropdown from '@components/layout/shared/UserDropdown';
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses';
// Hook Imports
import Logo from '@components/layout/shared/Logo';
import useHorizontalNav from '@menu/hooks/useHorizontalNav';
import { getLocalizedUrl } from '@utils/i18n';
// Type Imports
import type { Locale } from '@configs/i18n';
import { useParams } from 'next/navigation';
// Third-party Imports
import { Box, IconButton } from '@mui/material';
import classnames from 'classnames';
import { useState } from 'react';
// Next Imports
import Link from 'next/link';

import { getDictionary } from '@utils/getDictionary';
import AISearch from '../shared/AISearch';
import NavToggle from './NavToggle';


// Vars


const NavbarContent = ({ avatar, name, dictionary, roleChannel, menu }: {
  avatar: string,
  name: string,
  dictionary: Awaited<ReturnType<typeof getDictionary>>,
  roleChannel?: any[],
  menu?: any[]
}) => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav();
  const { locale } = useParams();
  const [openAppModal, setOpenAppModal] = useState(false);


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
        <AISearch menuData={menu || []} />
      </Box>

      <Box className='flex items-center'>
        <LayoutToggle />
        <Link href={getLocalizedUrl('/system-settings', locale as Locale)}>
          <IconButton size='small' color='inherit' title={dictionary['navigation'].system_settings || 'System Settings'}>
            <i className='ri-settings-3-line text-[22px] text-white' />
          </IconButton>
        </Link>
        <LanguageDropdown />
        {/* <ModeDropdown /> */}
        <UserDropdown avatar={avatar} name={name} dictionary={dictionary} />
      </Box>
    </Box>
  );
}

export default NavbarContent

