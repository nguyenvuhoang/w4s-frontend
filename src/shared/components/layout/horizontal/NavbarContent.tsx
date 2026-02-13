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

import { useSession } from 'next-auth/react';
import { learnAPIService } from '@/servers/system-service/services/learnapi.service';
import { isValidResponse } from '@/shared/utils/isValidResponse';
import SwalAlert from '@/shared/utils/SwalAlert';


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
  const { data: session } = useSession();

  const handleClearCache = async () => {
    if (!session?.user?.token) return;

    try {
      const res = await learnAPIService.clearCache({
        sessiontoken: session.user.token as string,
        language: locale as string
      });

      if (isValidResponse(res)) {
        SwalAlert('success', 'Clear cache successful', 'center');
      } else {
        const error = res.payload.dataresponse.errors?.[0]?.info || 'Clear cache failed';
        SwalAlert('error', error, 'center');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      SwalAlert('error', 'An unexpected error occurred', 'center');
    }
  };


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
        <IconButton size='small' color='inherit' title='Clear Cache' onClick={handleClearCache}>
          <i className='ri-refresh-line text-[22px] text-white' />
        </IconButton>
        <LanguageDropdown />
        {/* <ModeDropdown /> */}
        <UserDropdown avatar={avatar} name={name} dictionary={dictionary} />
      </Box>
    </Box>
  );
}

export default NavbarContent

