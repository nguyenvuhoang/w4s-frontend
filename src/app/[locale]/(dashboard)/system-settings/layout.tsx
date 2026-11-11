import type { ReactNode } from 'react'

import type { Locale } from '@/configs/i18n'
import { SYSTEM_SETTINGS_BASE_PATH } from '@/configs/staticRouteAccess'
import AuthorizedLayout from '@/shared/components/layout/AuthorizedLayout'

/**
 * Super Admin boundary of the whole System Settings area: the hub and every module below it
 * (including direct URLs such as /system-settings/provinces/1/edit) go through AuthorizedLayout with
 * the static super-admin policy of /system-settings (configs/staticRouteAccess). Non super admins get
 * AuthorizedLayout's Forbidden page. Pages keep their own AuthorizedLayout only when they need a
 * narrower action check (e.g. projects create = ADD).
 */
const SystemSettingsLayout = async ({ children, params }: { children: ReactNode; params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params

  return (
    <AuthorizedLayout requiredPath={SYSTEM_SETTINGS_BASE_PATH} params={{ locale }}>
      {() => <>{children}</>}
    </AuthorizedLayout>
  )
}

export default SystemSettingsLayout
