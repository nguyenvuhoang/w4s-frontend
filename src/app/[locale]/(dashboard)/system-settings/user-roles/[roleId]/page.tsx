import type { Metadata } from 'next'

import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import UserRoleDetailContent from '@/features/system-settings/user-roles/components/UserRoleDetailContent'
import { userRoleText } from '@/features/system-settings/user-roles/components/userRoleHelpers'
import { userRoleService } from '@/features/system-settings/user-roles/services/userRoleService'
import type { UserRoleItem, UserRoleWorkflowErrorInfo } from '@/features/system-settings/user-roles/types'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import logger from '@lib/logger'

export const metadata: Metadata = {
  title: 'Role Detail'
}

const UserRoleDetailPage = async ({
  params
}: {
  params: Promise<{ locale: Locale; roleId: string }>
}) => {
  const { locale, roleId: roleIdParam } = await params
  const roleId = Number(roleIdParam)
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  let role: UserRoleItem | null = null
  let initialError: UserRoleWorkflowErrorInfo | null = null

  if (!Number.isInteger(roleId) || roleId <= 0) {
    initialError = { message: userRoleText(dictionary, 'detail_not_found', 'Role detail was not found.') }
  } else {
    try {
      role = (await userRoleService.getUserRoleById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        roleId
      })).role

      if (!role) initialError = { message: userRoleText(dictionary, 'detail_not_found', 'Role detail was not found.') }
    } catch (error) {
      initialError = getWorkflowErrorPresentation(
        error,
        userRoleText(dictionary, 'detail_load_failed', 'Unable to load role detail.')
      )
      logger.error('[user-roles] Unable to load role detail', error)
    }
  }

  return (
    <Box sx={{ p: 6 }}>
      <UserRoleDetailContent dictionary={dictionary} locale={locale} role={role} error={initialError} />
    </Box>
  )
}

export default UserRoleDetailPage
