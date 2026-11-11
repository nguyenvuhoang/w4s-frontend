import type { Metadata } from 'next'

import { Box } from '@mui/material'

import { auth } from '@/auth'
import type { Locale } from '@/configs/i18n'
import { i18n } from '@/configs/i18n'
import MenuManagementContent from '@/features/system-settings/menu-management/components/MenuManagementContent'
import { menuManagementText } from '@/features/system-settings/menu-management/components/menuCommandHelpers'
import { menuCommandService } from '@/features/system-settings/menu-management/services/menuCommandService'
import { getServerBackendToken } from '@/server/auth/getServerBackendToken'
import { getDictionary } from '@/shared/utils/getDictionary'

import { parseMenuCommandFilter } from '../../pageRouteHelpers'
import type { SearchParams } from '../../pageRouteHelpers'
import logger from '@lib/logger'

export const metadata: Metadata = {
  title: 'Menu Management'
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }))
}

const MenuManagementPage = async ({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>
  searchParams?: Promise<SearchParams>
}) => {
  const { locale } = await params
  const search_params = await searchParams ?? {}
  const [dictionary, session] = await Promise.all([getDictionary(locale), auth()])
  const initialFilter = parseMenuCommandFilter(search_params)
  let initialData = menuCommandService.getDefaultSearchResponse(initialFilter)
  let initialError: string | null = null

  try {
    initialData = await menuCommandService.searchUserCommands({
      sessiontoken: (await getServerBackendToken()) ?? undefined,
      language: locale,
      filter: initialFilter
    })
  } catch (error) {
    initialError = error instanceof Error
      ? error.message
      : menuManagementText(dictionary, 'load_failed', 'Unable to load menu list.')
    logger.error('[menu-management] Unable to load initial data', error)
  }

  return (
    <Box sx={{ p: 6 }}>
      <MenuManagementContent
        dictionary={dictionary}
        session={session}
        locale={locale}
        initialFilter={{
          ...initialFilter,
          page_size: initialData.page_size
        }}
        initialData={initialData}
        initialError={initialError}
      />
    </Box>
  )
}

export default MenuManagementPage
