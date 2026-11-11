/**
 * Product profile for the shared IPS/W4S frontend baseline.
 *
 * The codebase is synced from IPS BEN; W4S-specific UI differences are switched here instead of
 * deleting the shared logic, so a future IPS sync stays a clean merge. Defaults to the W4S
 * profile; set `NEXT_PUBLIC_APP_PROFILE=ips` to restore IPS behaviour without code changes.
 *
 * Only presentation is controlled here. Project Context bootstrap (WF_BO_GET_BO_CONTEXT), the
 * working-project store, menu scope and RequireWorkingProject gating keep running unchanged in
 * every profile — authentication, authorization and project-scoped APIs depend on them.
 */
export type AppProfileName = 'w4s' | 'ips'

export type AppProfile = {
  name: AppProfileName
  brandName: string
  features: {
    /** Project Context dropdown in the header user-info bar. */
    showProjectContextSelector: boolean
    /** "You are working with data of project: ..." banner above dashboard content. */
    showProjectContextBanner: boolean
  }
  logos: {
    /** Full-colour logo for light surfaces (page loaders, spinners). */
    onLight: string
    /** White logo mark for dark/gradient surfaces (boot overlay, header). */
    onDark: string
  }
}

const PROFILES: Record<AppProfileName, AppProfile> = {
  w4s: {
    name: 'w4s',
    brandName: 'W4S',
    features: {
      showProjectContextSelector: false,
      showProjectContextBanner: false
    },
    logos: {
      onLight: '/images/logobank/logo.png',
      onDark: '/images/logobank/logo-white.png'
    }
  },
  ips: {
    name: 'ips',
    brandName: 'IPS',
    features: {
      showProjectContextSelector: true,
      showProjectContextBanner: true
    },
    logos: {
      onLight: '/images/logobank/logo.svg',
      onDark: '/images/logobank/logo-white.svg'
    }
  }
}

const resolveProfileName = (): AppProfileName =>
  process.env.NEXT_PUBLIC_APP_PROFILE?.trim().toLowerCase() === 'ips' ? 'ips' : 'w4s'

export const appProfile: AppProfile = PROFILES[resolveProfileName()]
