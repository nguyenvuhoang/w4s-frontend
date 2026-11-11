import type { Metadata } from 'next'

import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import MenuCommandCreateContent from '@/features/system-settings/menu-management/components/MenuCommandCreateContent'
import { getDictionary } from '@/shared/utils/getDictionary'

export const metadata: Metadata = {
  title: 'Create Menu'
}

const MenuManagementCreatePage = async ({
  params
}: {
  params: Promise<{ locale: Locale }>
}) => {
  const { locale } = await params
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])

  return (
    <Box sx={{ p: 6 }}>
      <MenuCommandCreateContent dictionary={dictionary} session={session} locale={locale} />
    </Box>
  )
}

export default MenuManagementCreatePage
