import http from '@/servers/lib/http'
import { SERVICE_SETTINGS_SERVICES, type ServiceSettingsService } from '../serviceSettingsConfig'
import type { ServiceSettingUpdatePayload } from '../types'

export { SERVICE_SETTINGS_SERVICES }
export type { ServiceSettingsService }

export class ServiceSettingsApiError extends Error {
  executionId?: string

  constructor(message: string, executionId?: string) {
    super(message)
    this.name = 'ServiceSettingsApiError'
    this.executionId = executionId
  }
}

const errorMessage = (payload: any, fallback = 'Unable to load service settings.') => payload?.message ?? payload?.detail ?? payload?.errors?.[0]?.info ?? fallback

const assertSuccess = (response: { status: number; payload: unknown }, fallback?: string) => {
  const payload = response.payload as any

  if (response.status < 200 || response.status >= 300 || payload?.success === false) {
    throw new ServiceSettingsApiError(String(errorMessage(payload, fallback)), payload?.execution_id ?? payload?.executionId)
  }

  return payload
}

export const serviceSettingsService = {
  async search(service: ServiceSettingsService) {
    const response = await http.post<unknown>(`/api/system-settings/service-settings?service=${service}`, {}, { baseUrl: '' })

    return assertSuccess(response)
  },

  // Same API client and proxy as `search`; the proxy maps `operation=update` to `/{service}/api/settings/update`.
  async updateServiceSetting(service: ServiceSettingsService, payload: ServiceSettingUpdatePayload) {
    const response = await http.post<unknown>(`/api/system-settings/service-settings?service=${service}&operation=update`, payload, { baseUrl: '' })

    return assertSuccess(response, 'Unable to update service setting.')
  }
}
