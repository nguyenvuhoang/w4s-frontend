export type ConfigFileServiceStatus = 'available' | 'coming-soon'

// `key` doubles as the backend serviceCode used to build every json-static-files API call:
// POST {key}/api/json-static-files/search|get|update. Confirmed against existing gateway
// routes (/ips/api/..., /cms/api/..., /wfo/api/..., /cth/api/..., /log/api/...) and the
// SERVICES registry in src/data/meta/default.ts. Adding a new service here is the only step
// needed to wire up its list/search/detail/edit/update screens — no per-service code required.
export type ConfigFileServiceDefinition = {
  key: string
  code: string
  textKey: string
  status: ConfigFileServiceStatus
}

export const CONFIG_FILE_SERVICE_DEFINITIONS: ConfigFileServiceDefinition[] = [
  {
    key: 'wfo',
    code: 'WFO',
    textKey: 'config_files_service_wfo',
    status: 'available'
  },
  {
    key: 'log',
    code: 'LOG',
    textKey: 'config_files_service_log',
    status: 'available'
  },
  {
    key: 'cms',
    code: 'CMS',
    textKey: 'config_files_service_cms',
    status: 'available'
  },
  {
    key: 'cth',
    code: 'CTH',
    textKey: 'config_files_service_cth',
    status: 'available'
  },
  {
    key: 'ips',
    code: 'IPS',
    textKey: 'config_files_service_ips',
    status: 'available'
  },
  {
    key: 'nch',
    code: 'NCH',
    textKey: 'config_files_service_nch',
    status: 'available'
  },
  {
    key: 'dts',
    code: 'DTS',
    textKey: 'config_files_service_dts',
    status: 'available'
  },
  {
    key: 'dwh',
    code: 'DataWareHouse',
    textKey: 'config_files_service_dwh',
    status: 'available'
  }
]

export const CONFIG_FILE_SERVICE_CODES = CONFIG_FILE_SERVICE_DEFINITIONS.map(module => module.key)

export const getConfigFileServiceDefinition = (serviceCode: string) =>
  CONFIG_FILE_SERVICE_DEFINITIONS.find(module => module.key === serviceCode.toLowerCase())
