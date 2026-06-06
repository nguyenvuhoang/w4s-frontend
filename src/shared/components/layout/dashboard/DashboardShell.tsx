'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'

import VerticalLayout from '@/@layouts/VerticalLayout'
import Navbar from '@components/layout/vertical/Navbar'
import Navigation from '@components/layout/vertical/Navigation'
import type { getDictionary } from '@utils/getDictionary'
import type { VerticalSubMenuDataType } from '@shared/types/menuTypes'

import { getMenuChildren } from '../shared/menu-utils'
import ModuleLauncher from './ModuleLauncher'

type DashboardShellProps = {
  children: ReactNode
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  menudata: VerticalSubMenuDataType[]
}

const DashboardShell = ({ children, dictionary, menudata }: DashboardShellProps) => {
  const pathname = usePathname()
  const [selectedModule, setSelectedModule] = useState<VerticalSubMenuDataType | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const activeModule = selectedPath === pathname ? selectedModule : null
  const selectedChildren = useMemo(() => (activeModule ? getMenuChildren(activeModule) : []), [activeModule])

  const handleParentClick = (item: VerticalSubMenuDataType) => {
    if (getMenuChildren(item).length > 0) {
      setSelectedModule(item)
      setSelectedPath(pathname)
    }
  }

  return (
    <VerticalLayout
      navigation={
        <Navigation
          dictionary={dictionary}
          menudata={menudata}
          onMenuItemClick={handleParentClick}
          activeItem={activeModule}
        />
      }
      navbar={<Navbar menuData={menudata} dictionary={dictionary} />}
      footer={<></>}
    >
      {selectedChildren.length > 0 && activeModule ? (
        <ModuleLauncher moduleItem={activeModule} dictionary={dictionary} onBack={() => setSelectedModule(null)} />
      ) : (
        children
      )}
    </VerticalLayout>
  )
}

export default DashboardShell
