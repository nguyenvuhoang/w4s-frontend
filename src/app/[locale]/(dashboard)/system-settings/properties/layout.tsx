import type { ReactNode } from 'react'

import type { Locale } from '@/configs/i18n'
import PropertyManagementTabs from '@/features/properties/PropertyManagementTabs'
import { getDictionary } from '@/shared/utils/getDictionary'

// Keeps the Dự án / Tháp / Tầng / Căn tabs mounted while switching between the tab routes; each route
// still runs its own AuthorizedLayout check. The tabs hide themselves on non-tab routes (detail, create...).
export default async function PropertiesLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dictionary = await getDictionary(locale as Locale)

  return (
    <>
      <PropertyManagementTabs
        admin={true}
        locale={locale as Locale}
        labels={dictionary.propertyManagement}
        ariaLabel={dictionary.propertyManagement.project}
      />
      {children}
    </>
  )
}
