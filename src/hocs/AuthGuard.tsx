// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'
import React from 'react'
import { auth } from '@/auth'

export default async function AuthGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  const session = await auth()
  return <>{session ? children : <AuthRedirect locale={locale as Locale} />}</>
}
