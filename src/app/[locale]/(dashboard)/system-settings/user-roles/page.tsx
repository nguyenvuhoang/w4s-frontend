import type { Metadata } from 'next'

import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import UserRolesContent from '@/features/system-settings/user-roles/components/UserRolesContent'
import { userRoleText } from '@/features/system-settings/user-roles/components/userRoleHelpers'
import { userRoleService } from '@/features/system-settings/user-roles/services/userRoleService'
import { getDictionary } from '@/shared/utils/getDictionary'

import { parseUserRoleFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export const metadata: Metadata = {
  title: 'Role Management'
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const UserRolesPage = async ({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>
  searchParams?: Promise<SearchParams>
}) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseUserRoleFilter(search_params)
  let initialData = userRoleService.getDefaultSearchResponse({
    page_index: Math.max(initialFilter.page_index - 1, 0),
    page_size: initialFilter.page_size
  })
  let initialError: string | null = null

  try {
    initialData = await userRoleService.searchUserRoles({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    initialError = error instanceof Error
      ? error.message
      : userRoleText(dictionary, 'load_failed', 'Unable to load user roles.')
    logger.error('[user-roles] Unable to load initial data', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <UserRolesContent
        dictionary={dictionary}
        session={session}
        locale={locale}
        initialFilter={{
          // page_index stays the UI-requested value from parseUserRoleFilter (1-based) — see
          // the same note in useUserRoleSearch.loadData for why initialData.page_index (the
          // server's own convention) must not overwrite it.
          ...initialFilter,
          page_size: initialData.page_size
        }}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default UserRolesPage
