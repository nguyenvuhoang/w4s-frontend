'use client'

// Next Imports
import { redirect, usePathname } from 'next/navigation'

// Type Imports
import type { Locale } from '@/configs/i18n'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@utils/i18n'

const AuthRedirect = ({ locale }: { locale: Locale }) => {
  const pathname = usePathname()

  const redirectUrl = `/${locale}/login?redirectTo=${pathname}`
  const login = `/${locale}/login`
  const homePage = getLocalizedUrl(themeConfig.homePageUrl, locale)

  return redirect(pathname === login ? login : pathname === homePage ? login : redirectUrl)
}

export default AuthRedirect

