import { decodePayload, preparePayloadContent } from '@/shared/components/json-view-editor/payloadViewerContent'

import type { ApplicationLogItem } from '../types'
import { maskSensitiveText, maskSensitiveValue } from './sensitiveDataMasking'

export type ApplicationLogRequestMeta = {
  protocol: string | null
  method: string | null
  endpoint: string | null
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const PROTOCOL_KEYS = ['protocol', 'requestprotocol']
const METHOD_KEYS = ['requestmethod', 'httpmethod', 'method']
const ENDPOINT_KEYS = ['requestpath', 'endpoint', 'path', 'url', 'requesturi']

const pickText = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return null
}

/**
 * Reads protocol / method / endpoint only from what the log actually carries (the structured
 * `properties` bag). Returns nulls when the backend did not record them — nothing is inferred.
 */
export const extractApplicationLogRequestMeta = (properties: unknown): ApplicationLogRequestMeta => {
  const decoded = decodePayload(properties)

  if (decoded.kind !== 'json' || Array.isArray(decoded.value)) return { protocol: null, method: null, endpoint: null }

  const normalized = Object.entries(decoded.value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (values, [key, value]) => {
      values[normalizeKey(key)] = value

      return values
    },
    {}
  )

  return {
    protocol: pickText(normalized, PROTOCOL_KEYS),
    method: pickText(normalized, METHOD_KEYS),
    endpoint: pickText(normalized, ENDPOINT_KEYS)
  }
}

export const hasApplicationLogPayload = (value: unknown) => decodePayload(value).kind !== 'empty'

export const isBlankApplicationLogValue = (value: unknown) => (
  value === null || value === undefined || (typeof value === 'string' && !value.trim())
)

const toMaskedJsonValue = (value: unknown) => {
  const content = preparePayloadContent(value, { sanitize: maskSensitiveValue, sanitizeText: maskSensitiveText })

  return content.kind === 'empty' ? null : content.value
}

/** Whole log as formatted JSON for the header copy button — sensitive values stay masked. */
export const buildApplicationLogCopyText = (item: ApplicationLogItem) => JSON.stringify({
  id: item.id,
  log_timestamp: item.log_timestamp,
  log_level: item.log_level,
  log_type: item.log_type,
  service_name: item.service_name,
  direction: item.direction,
  flow: item.flow,
  action_name: item.action_name,
  duration: item.duration,
  correlation_id: item.correlation_id,
  execution_id: item.execution_id,
  message: item.message ? maskSensitiveText(item.message) : null,
  headers: toMaskedJsonValue(item.headers),
  request_payload: toMaskedJsonValue(item.request),
  response_payload: toMaskedJsonValue(item.response),
  exception_details: toMaskedJsonValue(item.exception_details),
  properties: toMaskedJsonValue(item.properties)
}, null, 2)
