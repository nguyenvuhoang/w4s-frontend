import type { Metadata } from 'next'

import { Box } from '@mui/material'

import type { Locale } from '@/configs/i18n'
import UserRoleCreateContent from '@/features/system-settings/user-roles/components/UserRoleCreateContent'
import { getDictionary } from '@/shared/utils/getDictionary'

export const metadata: Metadata = {
  title: 'Add Role'
}

const UserRoleCreatePage = async ({
  params
}: {
  params: Promise<{ locale: Locale }>
}) => {
  const { locale } = await params
  const dictionary = await getDictionary(locale)

  return (
    <Box sx={{ p: 6 }}>
      <UserRoleCreateContent dictionary={dictionary} locale={locale} />
    </Box>
  )
}

export default UserRoleCreatePage
