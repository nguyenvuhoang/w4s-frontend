import logger from '@lib/logger'
import { SecureApiError } from '@/app/api/_lib/secure-api/errors'
import { createRequestId, fingerprintPayload, isRequestTraceEnabled } from '@/shared/utils/requestTrace'
import { resolveWorkflowScope } from '@/shared/utils/workflowScope'

// No `import 'server-only'` here on purpose: this module is reached via a dynamic import() from
// src/servers/lib/http.ts, which is also part of a Pages Router bundle in this project — Next.js
// statically rejects any `server-only`-tagged module reachable from there, even through a dynamic
// import gated on a runtime `!isClient()` check. Nothing in this file is safe to expose or risky
// to bundle (accessToken is passed in by the caller, never read from a server-only secret here),
// so the guard isn't load-bearing — actual server-only execution is still enforced by the
// `useInProcessSystemServiceCall`/`isClient()` runtime check at the one call site in http.ts.

/**
 * The ONE existing Next.js -> Backend integration for /system-service (URL, headers, body shape,
 * response processing) — unchanged since before the secure-transport work. Both callers reach it:
 *
 *  - src/app/api/system-service/route.ts (POST, wrapped in withSecureApi): browser requests,
 *    after the encrypted envelope has been decrypted back to the exact original payload.
 *  - src/servers/lib/http.ts (request(), server-side path): Server Components / other server
 *    code that used to reach this same backend call via an HTTP loopback through
 *    '/api/system-service' — now calls it in-process instead, since that loopback would otherwise
 *    have to either speak the browser's encrypted envelope (pointless for a same-process call) or
 *    duplicate this logic elsewhere. This file is the single source of truth either way; nothing
 *    about the backend URL/headers/body/response contract changes based on which caller invokes it.
 */

const ERROR_MESSAGES = {
  400: 'Bad Request',
  401: 'Phiên đăng nhập không hợp lệ.',
  403: 'Bạn không có quyền thực hiện chức năng này.',
  404: 'Không tìm thấy API được yêu cầu.',
  405: 'Phương thức gọi API không được hỗ trợ.',
  500: 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.',
  502: 'Bad Gateway. Vui lòng thử lại sau.',
  503: 'Service Unavailable. Vui lòng thử lại sau.',
  504: 'Gateway Timeout. Vui lòng thử lại sau.'
} as const

type ErrorStatusCode = keyof typeof ERROR_MESSAGES

// Without this, `fetch()` below has no time bound: if the backend/session is unhealthy and simply
// never responds (rather than returning a fast 401/error), this call hangs forever. Every Server
// Component that renders behind AuthorizedLayout (list -> create, list -> detail, ...) awaits this
// on every navigation to reauthorize the destination route, and the navigation overlay
// (NavigationOverlay/useRouter — see their own comments) has no client-side fallback by design: it
// only clears once the destination route's RSC response actually arrives. A hang here is therefore
// an infinite full-screen overlay with no recovery short of a manual refresh. Matches the timeout
// convention already used for the same backend host elsewhere (src/app/api/login/route.ts).
const BACKEND_FETCH_TIMEOUT_MS = 30000

type JsonRecord = Record<string, unknown>

export interface SystemServiceHeaderParams {
  lang?: string | null
  app?: string | null
  deviceId?: string | null
  scope?: string | null
  userAgent?: string | null
  /**
   * Correlation id for logs (browser x-request-id in development, otherwise the secure-api
   * envelope rid). Never sent to the backend.
   */
  requestId?: string | null
  /**
   * The incoming browser request's signal — used ONLY to classify a failure as CLIENT_ABORT in
   * logs. It is deliberately NOT passed to the backend fetch: aborting there would not roll back
   * a mutation the backend already started, it would only hide its outcome.
   */
  clientSignal?: AbortSignal | null
}

export type BackendFailureType = 'TIMEOUT' | 'CLIENT_ABORT' | 'NETWORK_ERROR'

/**
 * TIMEOUT: our own AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS) fired (DOMException
 * 'TimeoutError') — in either phase: waiting for headers OR reading the body.
 * CLIENT_ABORT: the browser closed its request to the BFF before the backend call failed.
 * NETWORK_ERROR: anything else — connection refused/reset, backend closed the socket mid-body.
 */
export const classifyBackendFailure = (error: unknown, clientSignal?: AbortSignal | null): BackendFailureType => {
  if (error instanceof Error && error.name === 'TimeoutError') return 'TIMEOUT'
  if (clientSignal?.aborted) return 'CLIENT_ABORT'

  return 'NETWORK_ERROR'
}

/**
 * Tạo header gửi sang backend. Giữ nguyên logic/tên header như trước khi có secure transport —
 * chỉ đổi cách nhận input (params thay vì đọc thẳng từ Request) để dùng chung được cho cả
 * Route Handler (browser) lẫn lời gọi server-side in-process.
 */
function buildBackendHeaders(
  accessToken: string,
  params: SystemServiceHeaderParams,
  scope: string | undefined
): HeadersInit {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    lang: params.lang || 'en',
    app: params.app || 'BO',
    my_device: JSON.stringify({
      device_id: params.deviceId || ''
    }),
    uid: accessToken
  }

  if (scope) {
    headers.scope = scope
  }

  if (params.userAgent) {
    headers['user-agent'] = params.userAgent
  }

  return headers
}

/**
 * Đọc response backend an toàn.
 */
async function safeParseJSON(response: Response): Promise<unknown> {
  const rawText = await response.text()

  if (!rawText.trim()) {
    return createErrorDataResponse(
      response.status,
      response.statusText || `Backend returned empty response with HTTP ${response.status}.`
    )
  }

  try {
    return JSON.parse(rawText)
  } catch {
    logger.error(
      `Backend response is not valid JSON. Status=${response.status}, Body=${rawText.slice(0, 1000)}`
    )

    return {
      error: [
        {
          key: String(response.status),
          info: response.statusText || 'Backend trả về dữ liệu không phải JSON.',
          execute_id: ''
        }
      ],
      raw_response: rawText
    }
  }
}

function extractBackendMessage(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return ''
  }

  const objectData = data as Record<string, any>

  if (typeof objectData.message === 'string' && objectData.message.trim()) {
    return objectData.message.trim()
  }

  if (Array.isArray(objectData.message) && objectData.message.length > 0) {
    return objectData.message
      .filter((item: unknown) => typeof item === 'string')
      .join('\n')
  }

  if (typeof objectData.error === 'string' && objectData.error.trim()) {
    return objectData.error.trim()
  }

  if (Array.isArray(objectData.errors) && objectData.errors.length > 0) {
    return objectData.errors
      .map((item: unknown) => {
        if (typeof item === 'string') {
          return item
        }

        if (item && typeof item === 'object') {
          const errorItem = item as Record<string, unknown>

          return errorItem.message ?? errorItem.info ?? errorItem.description ?? errorItem.code ?? ''
        }

        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  const nestedError = objectData.dataresponse?.error?.[0]

  if (nestedError) {
    return String(nestedError.info ?? nestedError.message ?? '')
  }

  return ''
}

/** Host + path of the backend endpoint, without query string or credentials. */
function safeEndpoint(url: string): string {
  try {
    const parsed = new URL(url)

    return `${parsed.host}${parsed.pathname}`
  } catch {
    return 'invalid-url'
  }
}

function createErrorDataResponse(status: number, message: string) {
  return {
    error: [
      {
        key: String(status),
        info: message,
        message,
        execute_id: ''
      }
    ]
  }
}

/**
 * Không log token, password và dữ liệu nhạy cảm.
 */
function sanitizeForLogging(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging)
  }

  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveKeys = new Set([
    'password',
    'old_password',
    'new_password',
    'confirm_password',
    'token',
    'access_token',
    'refresh_token',
    'sessiontoken',
    'authorization',
    'otp',
    'otp_code',
    'smartotp',
    'smartotp_code'
  ])

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? '***' : sanitizeForLogging(value)
    ])
  )
}

/**
 * The existing backend call, byte-for-byte unchanged: same URL (NEXT_PUBLIC_REST_API_ENDPOINT),
 * same headers, same body, same response processing/shape ({ dataresponse: backendData } on
 * success, thrown SecureApiError with the existing { code, message, dataresponse } body on
 * failure) as before the secure-transport work existed.
 */
export async function callSystemServiceBackend(
  requestData: JsonRecord,
  accessToken: string,
  headerParams: SystemServiceHeaderParams
): Promise<{ dataresponse: unknown }> {
  const scope = resolveWorkflowScope(requestData.workflowid, headerParams.scope)

  if (process.env.NODE_ENV === 'development') {
    logger.info(`📤 System-service request: ${JSON.stringify(sanitizeForLogging(requestData))} scope=${JSON.stringify(scope ?? null)} app=${JSON.stringify(headerParams.app)}`)
  }

  const backendUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT

  if (!backendUrl) {
    logger.error('NEXT_PUBLIC_REST_API_ENDPOINT is not configured.')

    throw new SecureApiError('NEXT_PUBLIC_REST_API_ENDPOINT chưa được cấu hình.', 500, {
      code: 'CONFIGURATION_ERROR',
      success: false,
      message: ['NEXT_PUBLIC_REST_API_ENDPOINT chưa được cấu hình.'],
      dataresponse: createErrorDataResponse(500, 'NEXT_PUBLIC_REST_API_ENDPOINT chưa được cấu hình.')
    })
  }

  const traceEnabled = isRequestTraceEnabled()
  const traceId = headerParams.requestId || createRequestId()
  const traceStartedAt = Date.now()
  const workflowIdForLog = typeof requestData.workflowid === 'string' ? requestData.workflowid : 'unknown'

  // Backend-only duration (excludes route compile, session decode and envelope decrypt), so a slow
  // "POST /api/system-service ... in 11.5s" line can be split into Next.js overhead vs backend.
  const traceBackend = (status: number | string) => {
    if (!traceEnabled) return

    logger.info(
      `[req-trace][server] ${traceId} ${workflowIdForLog} backend=${Date.now() - traceStartedAt}ms status=${status} fp=${fingerprintPayload(requestData.fields ?? requestData)} scope=${scope ? 'set' : 'none'}`
    )
  }

  /**
   * Single place every transport-level failure goes through, for BOTH phases (waiting for
   * response headers, and reading the body). Before this, only the headers phase was handled: a
   * TimeoutError raised while `response.text()` was still streaming escaped as a raw DOMException,
   * which withSecureApi logged as "[secure-api] Handler failed ... aborted due to timeout" and
   * turned into a generic 500 — with no workflow id, duration or request id to trace it by.
   * Logs exactly one line (warn for TIMEOUT/CLIENT_ABORT, error for NETWORK_ERROR) and always
   * throws a SecureApiError so callers get the standard 504/503 handling.
   */
  const failBackendCall = (error: unknown, phase: 'headers' | 'body', httpStatus?: number): never => {
    const type = classifyBackendFailure(error, headerParams.clientSignal)
    const detail =
      `[system-service] ${type} requestId=${traceId} workflow=${workflowIdForLog} endpoint=${safeEndpoint(backendUrl)} ` +
      `phase=${phase} duration=${Date.now() - traceStartedAt}ms timeout=${BACKEND_FETCH_TIMEOUT_MS}ms ` +
      `httpStatus=${httpStatus ?? 'none'} scope=${scope ? fingerprintPayload(scope) : 'none'} ` +
      `error=${error instanceof Error ? error.name : typeof error}`

    traceBackend(type.toLowerCase())

    if (type === 'NETWORK_ERROR') {
      logger.error(`${detail}: ${error instanceof Error ? error.message : String(error)}`)
    } else {
      logger.warn(detail)
    }

    const status = type === 'TIMEOUT' ? 504 : type === 'CLIENT_ABORT' ? 499 : 503
    const code = type === 'TIMEOUT' ? 'GATEWAY_TIMEOUT' : type === 'CLIENT_ABORT' ? 'CLIENT_CLOSED_REQUEST' : 'SERVICE_UNAVAILABLE'
    const message = type === 'TIMEOUT' ? ERROR_MESSAGES[504] : ERROR_MESSAGES[503]

    throw new SecureApiError(message, status, {
      code,
      success: false,
      message: [message],
      dataresponse: createErrorDataResponse(status, message)
    })
  }

  let response: Response

  try {
    // No caller currently threads a cancellation signal into this function (neither the
    // in-process SSR call site in servers/lib/http.ts nor the browser-facing
    // app/api/system-service/route.ts pass one), so nothing here can be aborted except by this
    // timeout — every AbortError this call can produce is therefore this timeout firing, never a
    // caller-initiated cancellation. If a caller signal is ever threaded in later, combine it
    // with AbortSignal.any([callerSignal, AbortSignal.timeout(...)]) instead of passing the
    // timeout signal alone, so a real cancellation (e.g. navigation/unmount) isn't reported as a
    // 504 Gateway Timeout.
    response = await fetch(backendUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: buildBackendHeaders(accessToken, headerParams, scope),
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS)
    })
  } catch (error) {
    // AbortSignal.timeout() rejects with a DOMException named 'TimeoutError' specifically (distinct
    // from the plain 'AbortError' a manually-called controller.abort() would produce) — see
    // classifyBackendFailure / failBackendCall above.
    return failBackendCall(error, 'headers')
  }

  /*
   * Đọc body đúng một lần.
   * Không sử dụng response.json() trực tiếp vì backend
   * có thể trả response rỗng.
   */
  // The timeout signal above still governs the body stream: headers can arrive in time while the
  // body is still being read when the 30s budget runs out (reproduced: headers after ~17ms,
  // `response.text()` then rejects with TimeoutError). Must go through the same failure path.
  let backendData: unknown

  try {
    backendData = await safeParseJSON(response)
  } catch (error) {
    return failBackendCall(error, 'body', response.status)
  }

  traceBackend(response.status)

  if (!response.ok) {
    const statusCode = response.status
    const defaultMessage =
      ERROR_MESSAGES[statusCode as ErrorStatusCode] ?? `HTTP ${statusCode}: Không thể xử lý yêu cầu.`

    const backendMessage = extractBackendMessage(backendData)
    const message = backendMessage || defaultMessage

    if (statusCode === 401) {
      logger.warn('System-service returned 401. The login session is invalid.')
    } else {
      logger.error(`System-service returned HTTP ${statusCode}: ${message}`)
    }

    /*
     * Luôn trả JSON, kể cả backend trả body rỗng.
     * Client sẽ không còn bị Unexpected end of JSON input.
     */
    throw new SecureApiError(message, statusCode, {
      code: statusCode === 401 ? 'UNAUTHORIZED' : `HTTP_${statusCode}`,
      success: false,
      message: [message],
      dataresponse: backendData ?? createErrorDataResponse(statusCode, message)
    })
  }

  return { dataresponse: backendData }
}
