import { getLocalizedUrl } from '@utils/i18n'

// Module-scope, not component state: shared by every error UI (ErrorPage, PageError, ...) so
// that whichever one detects an invalid-session error first is the only one that navigates —
// several can otherwise mount around the same time (nested Suspense boundaries, concurrent
// requests all failing together) and would each try to redirect independently.
let sessionLogoutTriggered = false

/**
 * Single global entry point for "the current session is invalid, send the user through /logout"
 * so it clears session/cookies fully before landing on /login, instead of every error UI
 * redirecting on its own. Safe to call from multiple places — only the first call (per page
 * load) actually navigates.
 */
export const triggerSessionLogoutRedirect = (replace: (url: string) => void) => {
  if (typeof window === 'undefined') return
  if (sessionLogoutTriggered) return

  const currentPath = window.location.pathname

  if (currentPath.includes('/logout') || currentPath.includes('/login')) return

  sessionLogoutTriggered = true

  const localeMatch = currentPath.match(/^\/([a-z]{2})(?:\/|$)/)

  replace(getLocalizedUrl('/logout', localeMatch?.[1]))
}
