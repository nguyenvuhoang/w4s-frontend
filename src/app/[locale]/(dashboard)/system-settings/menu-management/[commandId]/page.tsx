import type { Metadata } from 'next'

import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import MenuCommandDetailContent from '@/features/system-settings/menu-management/components/MenuCommandDetailContent'
import { menuManagementText } from '@/features/system-settings/menu-management/components/menuCommandHelpers'
import { menuCommandService } from '@/features/system-settings/menu-management/services/menuCommandService'
import type { MenuCommandItem, MenuCommandWorkflowErrorInfo } from '@/features/system-settings/menu-management/types'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'
import { getWorkflowErrorPresentation } from '@/shared/utils/workflowError'
import logger from '@lib/logger'

export const metadata: Metadata = {
  title: 'Menu Detail'
}

const MenuManagementDetailPage = async ({
  params
}: {
  params: Promise<{ locale: Locale; commandId: string }>
}) => {
  const { locale, commandId: commandIdParam } = await params
  const commandId = decodeURIComponent(commandIdParam ?? '').trim()
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  let item: MenuCommandItem | null = null
  let initialError: MenuCommandWorkflowErrorInfo | null = null

  if (!commandId) {
    initialError = { message: menuManagementText(dictionary, 'detail_not_found', 'Menu detail was not found.') }
  } else {
    try {
      item = (await menuCommandService.getUserCommandById({
        sessiontoken: (await getServerBackendToken()) ?? undefined,
        language: locale,
        commandId
      })).item

      if (!item) {
        initialError = { message: menuManagementText(dictionary, 'detail_not_found', 'Menu detail was not found.') }
      }
    } catch (error) {
      initialError = getWorkflowErrorPresentation(
        error,
        menuManagementText(dictionary, 'detail_load_failed', 'Unable to load menu detail.')
      )
      logger.error('[menu-management] Unable to load menu detail', error)
    }
  }

  return (
    <Box sx={{ p: 6 }}>
      <MenuCommandDetailContent dictionary={dictionary} session={session} locale={locale} item={item} error={initialError} />
    </Box>
  )
}

export default MenuManagementDetailPage
