import 'server-only'

import { cache } from 'react'
import logger from '@lib/logger'
import { env } from '@/env.mjs'
import { BrandingBackendError, fetchBrandingConfig } from '@/servers/system-settings/brandingGateway.server'
import { DEFAULT_BRANDING_SETTINGS, type BrandingSettings } from '@shared/constants/branding'

export { DEFAULT_BRANDING_SETTINGS }
export type { BrandingSettings }

/**
 * Reads branding config for Server Components that render before/without a client-side fetch
 * (Providers, the branding module page, ForgetPassword, root layout). Calls the backend
 * in-process — same pattern as other SSR prefetches in this app, avoids a self HTTP loopback.
 *
 * fetchBrandingConfig() resolves the visitor's backend session token itself (getServerBackendToken)
 * and sends it when present — the backend still requires auth for this endpoint. Branding is also
 * rendered before login (Login screen, favicon, loading screen), where there is no token yet;
 * that's expected, not a bug, and is logged quietly rather than as a warning.
 *
 * Priority on failure: ENV default -> hardcoded themeConfig-style default. Never throws, never
 * fakes backend data.
 */
export const getBrandingSettings = cache(async (): Promise<BrandingSettings> => {
  try {
    return await fetchBrandingConfig()
  } catch (error) {
    const hadAccessToken = error instanceof BrandingBackendError ? error.hadAccessToken : true
    const message = (error as Error)?.message ?? error

    if (hadAccessToken) {
      logger.warn('getBrandingSettings: backend unavailable, falling back to ENV/default —', message)
    } else {
      logger.info('getBrandingSettings: no session yet (e.g. Login screen), falling back to ENV/default —', message)
    }

    return {
      ...DEFAULT_BRANDING_SETTINGS,
      brandingName: env.NEXT_PUBLIC_APPLICATION_TITLE || DEFAULT_BRANDING_SETTINGS.brandingName
    }
  }
})
