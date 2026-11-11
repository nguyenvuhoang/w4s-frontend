'use client'

import { Locale } from '@/configs/i18n'
import { getLocalizedUrl } from '@utils/i18n'
import { useRouter } from '@shared/hooks/useRouter'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { useWorkingProjectStore } from '@/@core/stores/useWorkingProjectStore'
import { menuService } from '@/shared/services/menuService'

const useLogout = ({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary?: any;
}) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { status } = useSession()
  const hasRunRef = useRef(false)

  useEffect(() => {
    // Wait for NextAuth to resolve the session so the backend logout call
    // below has a valid token to work with; run the logout flow only once.
    if (status === 'loading' || hasRunRef.current) return
    hasRunRef.current = true

    const handleLogout = async () => {
      try {
        // Invalidate the session on the backend BEFORE clearing the Next.js session below.
        // The real backend token never reaches the browser (see src/auth.ts) — /api/logout
        // resolves it itself, server-side, from the session cookie.
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'manual' })
        }).catch(err => {})

        // Get CSRF token first
        const csrfResponse = await fetch('/api/auth/csrf')
        const { csrfToken } = await csrfResponse.json()

        // Call the signout API with CSRF token
        const response = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            csrfToken,
            callbackUrl: getLocalizedUrl('/login', locale)
          }),
          credentials: 'include'
        })

        if (!response.ok && response.status !== 302) {
          throw new Error('Logout failed')
        }

        // Clear any local storage tokens vÃ  gá»i API xÃ³a cookie app á»Ÿ server
        useWorkingProjectStore.getState().reset()
        menuService.clearMenuCache()

        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
        }

        await fetch('/api/clear-app', { method: 'POST', credentials: 'include' })


        // Allow a paint frame before redirecting so the logout UI is visible briefly
        if (typeof window !== 'undefined') {
          // schedule after next paint, then small timeout to ensure UI rendered
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.location.href = getLocalizedUrl('/login', locale)
            }, 2000)
          })
        }
      } catch (err: any) {
        setError(err?.message || 'Logout failed. Please try again.')
      }
    }

    handleLogout()
  }, [locale, router, status])

  return (
    <></>
  )
}
export default useLogout

