'use client'

import { useMemo } from 'react'

import { Box, CircularProgress } from '@mui/material'

import { useRouter } from '@shared/hooks/useRouter'
import type { Locale } from '@configs/i18n'
import type { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import { useAppContext } from '@contexts/AppContext'
import { filterMenuForSidebar } from '@shared/permissions/permissionUtils'
import type { VerticalMenuDataType } from '@shared/types/menuTypes'
import ForbiddenPage from '@/views/ForbiddenPage'

import { excludeMenuRoutes, findMenuNodeByCommandId } from '../shared/menu-utils'
import ModuleLauncher from './ModuleLauncher'

type ModuleHubContentProps = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  locale: Locale
  commandId: string
}

// Renders the submenu-list screen for a parent menu at its own `/module/[commandId]` route (see
// DashboardShell.handleParentClick). The menu tree only exists client-side in AppContext (it is
// project-scope dependent and fetched after ProjectContext is READY — see DashboardContent), so
// the lookup has to happen here rather than in the server page.tsx.
const ModuleHubContent = ({ dictionary, locale, commandId }: ModuleHubContentProps) => {
  const { menuData, isLoaded } = useAppContext()
  const router = useRouter()

  // Same permission + visibility filtering the sidebar itself renders from, so this route can
  // never expose a menu the current user is not allowed to see (requirement: invalid/unauthorized
  // commandId must not reveal its submenus).
  const visibleMenuData = useMemo(
    () => excludeMenuRoutes(filterMenuForSidebar(menuData as any) as unknown as VerticalMenuDataType[]),
    [menuData]
  )

  const moduleItem = useMemo(
    () => findMenuNodeByCommandId(visibleMenuData, commandId),
    [visibleMenuData, commandId]
  )

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!moduleItem) {
    return <ForbiddenPage locale={locale} dictionary={dictionary} />
  }

  return (
    <ModuleLauncher
      moduleItem={moduleItem}
      dictionary={dictionary}
      onBack={() => router.push(getLocalizedUrl('/', locale))}
    />
  )
}

export default ModuleHubContent
