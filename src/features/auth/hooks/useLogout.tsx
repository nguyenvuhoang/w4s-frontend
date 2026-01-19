'use client'

import { Locale } from '@/configs/i18n'
import { getLocalizedUrl } from '@/utils/i18n'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const useLogout = ({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary?: any;
}) => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleLogout = async () => {
      try {
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

        // Clear any local storage tokens và gọi API xóa cookie app ở server
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
        console.error('[LOGOUT] Failed:', err)
        setError(err?.message || 'Logout failed. Please try again.')
      }
    }

    handleLogout()
  }, [locale, router])

  return (
    <></>
  )
}
export default useLogout
