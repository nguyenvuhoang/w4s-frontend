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
import { useAppContext } from '@contexts/AppContext';
// Next Imports
import { RouterLink as Link } from '@menu/components/RouterLink';

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
      const payload = res.payload as any;

      const isSuccess = res.status === 200 && (payload?.success === true || isValidResponse(res));

      if (isSuccess) {
        SwalAlert('success', 'Clear cache successful', 'center');
      } else {
        const error =
          payload?.data?.message ||
          payload?.data?.errors?.[0]?.info ||
          payload?.message ||
          payload?.dataresponse?.errors?.[0]?.info ||
          'Clear cache failed';
        SwalAlert('error', error, 'center');
      }
    } catch {
      SwalAlert('error', 'An unexpected error occurred', 'center');
    }
  };

const { userInfo } = useAppContext()

const isTruthyFlag = (value: unknown) =>
  value === true || value === 1 || ['1', 'true', 'yes', 'y', 't'].includes(String(value ?? '').trim().toLowerCase())

const isSuperAdmin = ['is_supper_admin', 'issuperadmin', 'is_super_admin', 'isSuperAdmin'].some(
  key => isTruthyFlag((userInfo as Record<string, unknown> | null)?.[key])
)

  return (
    <Box
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <Box className='flex items-center gap-4'>
        <NavToggle />
        {!isBreakpointReached && (
          <Link href={getLocalizedUrl('/', locale as Locale)}>
            <Logo variant='topMenu' />
          </Link>
        )}
        <AISearch menuData={menu || []} />
      </Box>

      <Box className='flex items-center'>
        <LayoutToggle />
        {isSuperAdmin && (
          <Link href={getLocalizedUrl('/system-settings', locale as Locale)}>
            <IconButton size='small' color='inherit' title={dictionary['navigation'].system_settings || 'System Settings'}>
              <i className='ri-settings-3-line text-[22px] text-white' />
            </IconButton>
          </Link>
        )}
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

