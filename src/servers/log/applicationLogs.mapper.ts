// Pure mapping helpers for the application logs gateway. Kept free of `server-only` so the
// contract mapping can be unit tested; only applicationLogs.server.ts should consume it at runtime.

export type ApplicationLogItemDTO = {
  id: string
  correlation_id: string | null
  execution_id: string | null
  log_timestamp: string | number | null
  log_level: string | null
  log_type: string | null
  service_name: string | null
  direction: string | null
  flow: string | null
  action_name: string | null
  duration: number | null
  message: string | null
  headers: unknown
  request: unknown
  response: unknown
  exception_details: unknown
  properties: unknown
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

export const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  // Backend casing varies (snake_case, camelCase, PascalCase) — match on a normalized key.
  const normalized = Object.keys(item).reduce<Record<string, any>>((values, key) => {
    values[normalizeKey(key)] = item[key]

    return values
  }, {})

  for (const key of keys) {
    const value = normalized[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

export const toNumber = (value: unknown, fallback: number | null = 0) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

// Message is display text: keep strings untouched, stringify a structured message exactly once.
const toMessageText = (value: unknown): string | null => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value, null, 2)

  return String(value)
}

/**
 * Maps one backend log row. Payload fields are passed through untouched (string or object) —
 * parsing happens once, at display time. The backend contract uses `request_payload` /
 * `response_payload` (see ApplicationLogItem in shared/types/systemTypes.ts); the legacy
 * `request` / `request_content` names are kept as fallbacks.
 */
export const mapApplicationLogItem = (item: any, index: number): ApplicationLogItemDTO => ({
  id: String(getField(item, ['id', 'log_id']) ?? `${getField(item, ['correlation_id']) ?? 'log'}-${index}`),
  correlation_id: getField(item, ['correlation_id']) ?? null,
  execution_id: getField(item, ['execution_id']) ?? null,
  log_timestamp: getField(item, ['log_timestamp', 'timestamp']) ?? null,
  log_level: getField(item, ['log_level', 'level']) ?? null,
  log_type: getField(item, ['log_type']) ?? null,
  service_name: getField(item, ['service_name']) ?? null,
  direction: getField(item, ['direction']) ?? null,
  flow: getField(item, ['flow']) ?? null,
  action_name: getField(item, ['action_name']) ?? null,
  duration: toNumber(getField(item, ['duration', 'duration_ms']), null),
  message: toMessageText(getField(item, ['message'])),
  headers: getField(item, ['headers']) ?? null,
  request: getField(item, ['request_payload', 'request', 'request_content']) ?? null,
  response: getField(item, ['response_payload', 'response', 'response_content']) ?? null,
  exception_details: getField(item, ['exception_details', 'exception', 'stack_trace']) ?? null,
  properties: getField(item, ['properties']) ?? null
})
