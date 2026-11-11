// This whitelist is shared by the UI selector and the server-side proxy. Adding a service here
// is the only required wiring step; clients can never provide a backend URL or arbitrary path.
export const SERVICE_SETTINGS = {
  IPS: { label: 'IPS', path: '/ips/api/settings/search', updatePath: '/ips/api/settings/update' },
  WFO: { label: 'WFO', path: '/wfo/api/settings/search', updatePath: '/wfo/api/settings/update' },
  CTH: { label: 'CTH', path: '/cth/api/settings/search', updatePath: '/cth/api/settings/update' },
  LOG: { label: 'LOG', path: '/log/api/settings/search', updatePath: '/log/api/settings/update' },
  RPT: { label: 'RPT', path: '/rpt/api/settings/search', updatePath: '/rpt/api/settings/update' },
  CMS: { label: 'CMS', path: '/cms/api/settings/search', updatePath: '/cms/api/settings/update' }
} as const

// Operations supported by the shared service-settings proxy. Search stays the default so the
// existing search request (no `operation` param) is unchanged.
export type ServiceSettingsOperation = 'search' | 'update'

export const SERVICE_SETTINGS_SERVICES =Object.keys(SERVICE_SETTINGS) as Array<keyof typeof SERVICE_SETTINGS>
export type ServiceSettingsService = keyof typeof SERVICE_SETTINGS
