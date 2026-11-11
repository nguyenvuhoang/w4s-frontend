import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { env } from '@/env.mjs'
import { SERVICE_SETTINGS, SERVICE_SETTINGS_SERVICES, type ServiceSettingsOperation, type ServiceSettingsService } from '@/features/system-settings/service-settings/serviceSettingsConfig'
import { buildConfigFilesBackendHeaders } from './configFilesGateway.server'

export { SERVICE_SETTINGS_SERVICES }
export type { ServiceSettingsService }

const getString = (value: unknown) => typeof value === 'string' ? value.trim() : ''

export const isServiceSettingsService = (value: string): value is ServiceSettingsService =>
  SERVICE_SETTINGS_SERVICES.includes(value.toUpperCase() as ServiceSettingsService)

export const buildServiceSettingsUrl = (service: ServiceSettingsService, operation: ServiceSettingsOperation = 'search') => {
  const baseUrl = env.CMS_HOST?.replace(/\/$/, '')

  if (!baseUrl) return null

  const config = SERVICE_SETTINGS[service]

  return new URL(`${baseUrl}${operation === 'update' ? config.updatePath : config.path}`)
}

const isRecordId = (value: unknown): value is number | string =>
  (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.trim() !== '')

/**
 * Validates the update body and rebuilds it with only the four contract fields. `value` is
 * forwarded verbatim (no trim / type coercion); `id`, `name`, `organization_id` come from the
 * original record on the client and are passed through untouched.
 */
export const parseServiceSettingsUpdateBody = (body: any) => {
  if (!body || typeof body !== 'object') return null
  if (!isRecordId(body.id) || typeof body.name !== 'string' || !body.name || typeof body.value !== 'string') return null

  const organizationId = body.organization_id

  if (organizationId !== null && organizationId !== undefined && !isRecordId(organizationId)) return null

  return { name: body.name, value: body.value, organization_id: organizationId ?? null, id: body.id }
}

// Reuse the standard system-settings proxy authentication/header contract. This keeps the
// backend credential server-side and includes uid, lang, app, user-agent, and device metadata.
export const buildServiceSettingsHeaders = buildConfigFilesBackendHeaders

export const readServiceSettingsPayload = async (response: Response) => {
  const text = await response.text()
  if (!text) return null

  try { return JSON.parse(text) } catch { return { message: text } }
}

export const serviceSettingsErrorResponse = (payload: any, status: number, fallback: string) => {
  const firstError = Array.isArray(payload?.errors) ? payload.errors[0] : null
  const message = getString(payload?.message) || getString(payload?.detail) || getString(firstError?.info) || getString(firstError?.message) || fallback
  const executionId = getString(payload?.execution_id) || getString(payload?.executionId) || getString(payload?.data?.execution_id)

  return NextResponse.json({ success: false, message, execution_id: executionId || undefined }, { status })
}
