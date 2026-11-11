/**
 * HTTP statuses that mean "the backend/system-service is unreachable right now" — an availability
 * problem, never an authentication one. Mirrors what src/servers/system-service/callBackend.ts
 * produces: 504 on its own AbortSignal.timeout(), 503 when the fetch fails before any response,
 * and the backend/gateway's own 502/503/504 passed straight through.
 */
export const SERVICE_UNAVAILABLE_HTTP_STATUSES: ReadonlySet<number> = new Set([502, 503, 504])

// Browser fetch() network failures surface as a plain TypeError whose message differs per engine.
const NETWORK_FAILURE_MESSAGES = ['failed to fetch', 'networkerror', 'load failed', 'network request failed']

const readStatus = (error: Record<string, unknown>): number | null => {
  for (const key of ['httpStatus', 'status', 'statusCode']) {
    const value = Number(error[key])

    if (Number.isInteger(value) && value > 0) return value
  }

  return null
}

/**
 * True only for timeouts / 502 / 503 / 504 / network-level failures. 400/401/403/404, workflow
 * business errors and validation errors are NOT service-unavailable — those must keep their own
 * handling (401 in particular still goes through the existing logout flow in http.ts).
 *
 * Classification prefers a structured status (BoContextError.httpStatus, HttpError.status, ...)
 * and only falls back to error name/message for errors that carry no status at all.
 */
export const isServiceUnavailableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false

  const status = readStatus(error as Record<string, unknown>)

  if (status !== null) return SERVICE_UNAVAILABLE_HTTP_STATUSES.has(status)

  const { name, message } = error as { name?: unknown; message?: unknown }

  if (name === 'AbortError' || name === 'TimeoutError') return true

  // http.ts throws this after a 502 maintenance redirect has already been kicked off.
  if (message === 'SYSTEM_MAINTENANCE') return true

  if (error instanceof TypeError && typeof message === 'string') {
    const normalized = message.toLowerCase()

    return NETWORK_FAILURE_MESSAGES.some(pattern => normalized.includes(pattern))
  }

  return false
}
