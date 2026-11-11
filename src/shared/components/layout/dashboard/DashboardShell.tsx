'use client'

import type { ReactNode } from 'react'

import { useParams } from 'next/navigation'

import VerticalLayout from '@/@layouts/VerticalLayout'
import Navbar from '@components/layout/vertical/Navbar'
import Navigation from '@components/layout/vertical/Navigation'
import { useAppContext } from '@contexts/AppContext'
import { useRouter } from '@shared/hooks/useRouter'
import type { Locale } from '@configs/i18n'
import type { getDictionary } from '@utils/getDictionary'
import { getLocalizedUrl } from '@utils/i18n'
import type { VerticalSubMenuDataType } from '@shared/types/menuTypes'

import { getCommandId, getMenuChildren } from '../shared/menu-utils'

type DashboardShellProps = {
  children: ReactNode
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menudata: VerticalSubMenuDataType[]
}

const DashboardShell = ({ children, dictionary, menudata }: DashboardShellProps) => {
  const { menuData } = useAppContext()
  const router = useRouter()
  const { locale } = useParams()
  const appMenuData = menuData.length > 0 ? menuData : menudata

  // Navigates to the parent menu's own `/module/[commandId]` hub route instead of swapping in
  // client state — the previous approach left the URL pointing at whatever business screen was
  // open before the click, so a second click, refresh, or Back all disagreed with what was on
  // screen. See ModuleHubContent for the route that renders the submenu list.
  const handleParentClick = (item: VerticalSubMenuDataType) => {
    if (getMenuChildren(item).length === 0) return

    const commandId = getCommandId(item)

    if (!commandId) return

    router.push(getLocalizedUrl(`/module/${encodeURIComponent(commandId)}`, locale as Locale))
  }

  return (
    <VerticalLayout
      navigation={
        <Navigation
          dictionary={dictionary}
          menudata={appMenuData}
          onMenuItemClick={handleParentClick}
        />
      }
      navbar={<Navbar menuData={appMenuData} dictionary={dictionary} />}
      footer={<></>}
    >
      {children}
    </VerticalLayout>
  )
}

export default DashboardShell
