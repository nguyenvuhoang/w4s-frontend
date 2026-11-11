import http from '@/servers/lib/http'

const CONFIG_FILES_API_BASE = '/api/system-settings/config-files'

export type StaticFileSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
}

export class ConfigFileApiError extends Error {
  executionId?: string

  constructor(message: string, executionId?: string) {
    super(message)
    this.name = 'ConfigFileApiError'
    this.executionId = executionId
  }
}

const extractExecutionId = (payload: any): string | undefined =>
  payload?.execution_id ??
  payload?.executionId ??
  payload?.execute_id ??
  payload?.dataresponse?.execution_id ??
  payload?.dataresponse?.execute_id

const extractMessage = (payload: any, fallbackMessage: string) =>
  payload?.error_message ??
  payload?.description ??
  payload?.message ??
  payload?.detail ??
  payload?.title ??
  payload?.errors?.[0]?.info ??
  payload?.errors?.[0]?.message ??
  payload?.error ??
  fallbackMessage

const assertSuccess = <T,>(response: { status: number; payload: T }, fallbackMessage: string) => {
  const payload = response.payload as any

  if (response.status < 200 || response.status >= 300 || payload?.success === false) {
    const message = extractMessage(payload, fallbackMessage)

    throw new ConfigFileApiError(String(message), extractExecutionId(payload))
  }

  return response.payload
}

export const configFileService = {
  async searchStaticConfigFiles(serviceCode: string, request: StaticFileSearchRequest) {
    const response = await http.post<unknown>(`${CONFIG_FILES_API_BASE}/${serviceCode}/static-files`, request, {
      baseUrl: ''
    })

    return assertSuccess(response, 'Unable to load config files.')
  },

  async getStaticConfigFile(serviceCode: string, relativePath: string) {
    const params = new URLSearchParams({ relative_path: relativePath })
    const response = await http.get<unknown>(`${CONFIG_FILES_API_BASE}/${serviceCode}/static-file?${params.toString()}`, {
      baseUrl: ''
    })

    return assertSuccess(response, 'Unable to load config file.')
  },

  async updateStaticConfigFile(serviceCode: string, relativePath: string, content: string) {
    const response = await http.post<unknown>(`${CONFIG_FILES_API_BASE}/${serviceCode}/update`, {
      relative_path: relativePath,
      content
    }, {
      baseUrl: '',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return assertSuccess(response, 'Unable to update config file.')
  }
}
