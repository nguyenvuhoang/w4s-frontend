import envConfig from '@/configs/config';
import { i18n } from '@/configs/i18n';
import { normalizePath } from '@utils';
import { decrypt, isEncryptedPayload, createEncryptedPayload, generateNonce, createHMAC } from '@lib/crypto';
import { restoreSavedProjects, snapshotSavedProjects, useWorkingProjectStore } from '@/@core/stores/useWorkingProjectStore';
import { redirectToMaintenance } from '@utils/maintenance';
import { secureFetch } from '@/lib/secure-api/client';
import { isSessionInvalidWorkflowResponse } from '@/shared/utils/isTokenError';
import { clearInflightRequests, dedupeInflight, getDynamicWorkflowId, isReadOnlyWorkflowId } from '@/shared/utils/inflightDedupe';
import { resolveWorkflowScope } from '@/shared/utils/workflowScope';
import {
  createRequestId,
  fingerprintPayload,
  isRequestTraceEnabled,
  recordRequestTrace,
  resolveCaller,
  stableStringify,
  type RequestTraceCache
} from '@/shared/utils/requestTrace';

// BFF routes migrated to the real secure-api envelope (src/lib/secure-api). Every other route
// still goes through the plain same-origin fetch below — see the reroute logic a few lines down
// for why that's already safe (server resolves its own credential, ignores client input) even
// before its payload is migrated to this envelope. Extend this set as more routes migrate.
const SECURE_API_PATHS = new Set(['/system-service']);

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
  /** CÃ³ mÃ£ hÃ³a request body khÃ´ng */
  encrypt?: boolean;
  /** CÃ³ giáº£i mÃ£ response khÃ´ng */
  decryptResponse?: boolean;
  /**
   * Skip the global 502 -> /maintenance redirect and surface the 502 to the caller as an
   * HttpError instead. Only for callers that render their own unavailable state and retry in
   * place (WF_BO_GET_BO_CONTEXT bootstrap — see boContextService); every other caller keeps the
   * existing redirect.
   */
  suppressMaintenanceRedirect?: boolean;
}

export const ENTITY_ERROR_STATUS = 422
export const AUTHENTICATION_ERROR_STATUS = 401
export const VERIFY_ERROR_STATUS = 501
export const BAD_REQUEST = 400
export const NOTFOUND = 404
export const FORBIDDEN = 403
export const INTERNAL_SERVER_ERROR = 500
export const TOO_MANY_REQUESTS = 429
export const SERVICE_UNAVAILABLE = 503
export const GATEWAY_TIMEOUT = 504

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

export class HttpError extends Error {
  status: number
  payload: {
    message: string
    [key: string]: any
  }
  constructor({ status, payload }: { status: number; payload: any }) {
    super('Http Error')
    this.status = status
    this.payload = payload
  }
}

export class EntityError extends HttpError {
  status: 422 | 501 | 500 | 403 | 404
  payload: EntityErrorPayload
  constructor({
    status,
    payload
  }: {
    status: 422 | 501 | 500 | 403 | 404
    payload: EntityErrorPayload
  }) {
    super({ status, payload })
    this.status = status
    this.payload = payload
  }
}

const SESSION_NOT_FOUND_GRPC_MESSAGE = "gRPC call [GetUserSessionAsync] failed with message 'Not found.'."

let clientLogoutRequest: null | Promise<void> = null
let clientLogoutStarted = false

export const isClient = () => typeof window !== 'undefined'

const containsSessionNotFoundGrpcError = (value: unknown, seen = new WeakSet<object>()): boolean => {
  if (!value) return false

  if (typeof value === 'string') {
    return value.includes(SESSION_NOT_FOUND_GRPC_MESSAGE)
  }

  if (value instanceof Error) {
    return value.message.includes(SESSION_NOT_FOUND_GRPC_MESSAGE)
  }

  if (typeof value !== 'object') return false

  if (seen.has(value)) return false
  seen.add(value)

  if (Array.isArray(value)) {
    return value.some(item => containsSessionNotFoundGrpcError(item, seen))
  }

  return Object.values(value as Record<string, unknown>).some(item =>
    containsSessionNotFoundGrpcError(item, seen)
  )
}

const getLoginUrl = () => {
  const currentPath = window.location.pathname
  const localeMatch = currentPath.match(/^\/([a-z]{2})/)
  const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale

  return `/${locale}/login`
}

const expireCookie = (name: string, path = '/') => {
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT'

  document.cookie = `${name}=; Path=${path}; Expires=${expires}; Max-Age=0; SameSite=Lax`
  document.cookie = `${name}=; Path=${path}; Expires=${expires}; Max-Age=0; SameSite=None; Secure`
}

const clearBrowserSessionState = () => {
  if (!isClient()) return

  // Wipe the in-memory project context immediately so a subsequent login (without a full
  // page reload) never inherits this user's selected project/scope in memory while
  // localStorage below is being cleared.
  try {
    useWorkingProjectStore.getState().reset()
  } catch {}

  // No read issued under this session may be joined by a request made after logout.
  clearInflightRequests()

  // localStorage.clear() below is a blanket security wipe (tokens, etc.), but logging out
  // must never delete a user's saved project (per-user key ips:selected-project:<user_code>)
  // — only their in-memory selection. Snapshot it first and restore right after clearing.
  const preservedProjects = snapshotSavedProjects()

  try {
    localStorage.clear()
  } catch {}

  restoreSavedProjects(preservedProjects)

  try {
    sessionStorage.clear()
  } catch {}

  try {
    const existingCookieNames = document.cookie
      .split(';')
      .map(cookie => cookie.split('=')[0]?.trim())
      .filter(Boolean)

    const authCookieNames = [
      ...existingCookieNames,
      'app',
      'authjs.callback-url',
      'authjs.csrf-token',
      'authjs.session-token',
      '__Host-authjs.csrf-token',
      '__Secure-authjs.callback-url',
      '__Secure-authjs.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      'next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.session-token'
    ]

    const pathSegments = window.location.pathname.split('/').filter(Boolean)
    const cookiePaths = new Set<string>(['/'])

    pathSegments.reduce((path, segment) => {
      const nextPath = `${path}${segment}/`
      cookiePaths.add(nextPath)

      return nextPath
    }, '/')

    Array.from(new Set(authCookieNames)).forEach(name => {
      cookiePaths.forEach(path => expireCookie(name, path))
    })
  } catch {}
}

export const logoutClientSession = async (reason: string) => {
  if (!isClient()) return

  if (clientLogoutRequest) {
    await clientLogoutRequest

    return
  }

  if (clientLogoutStarted) return
  clientLogoutStarted = true

  clientLogoutRequest = (async () => {
    const loginUrl = getLoginUrl()

    clearBrowserSessionState()

    try {
      await fetch('/api/logout', {
        method: 'POST',
        body: JSON.stringify({ force: true, reason }),
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
    } catch {}

    try {
      await fetch('/api/clear-app', { method: 'POST', credentials: 'include' })
    } catch {}

    try {
      const { signOut } = await import('next-auth/react')
      await signOut({ redirect: false, callbackUrl: loginUrl })
    } catch {}

    clearBrowserSessionState()

    const currentPath = window.location.pathname
    if (!currentPath.includes('/login')) {
      window.location.replace(loginUrl)
    }
  })()

  await clientLogoutRequest
}

const createRequireLogoutResponse = <Response>(payload: Response, status = 401) => ({
  status,
  payload: {
    ...(payload && typeof payload === 'object' ? payload : {}),
    requireLogout: true
  } as Response
})

/**
 * Once a client-side session-invalid redirect has been kicked off (logoutClientSession has
 * already cleared state and called location.replace), the caller must never see a resolved
 * response — any code that runs after `await` (setState, toast.error, etc.) would still get a
 * chance to render for the instant before the browser actually navigates away. Returning a
 * promise that never resolves keeps every caller suspended behind its own loading state until
 * navigation completes, so no screen gets to flash a stale/generic error first.
 */
const suspendAfterClientLogout = <T>(): Promise<T> => new Promise<T>(() => { })

const executeRequest = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined
  const shouldEncrypt = options?.encrypt ?? false
  const shouldDecryptResponse = options?.decryptResponse ?? false

  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    // MÃ£ hÃ³a request body náº¿u cáº§n
    if (shouldEncrypt && typeof options.body === 'object') {
      const encryptedPayload = await createEncryptedPayload(options.body)
      encryptedPayload.nonce = generateNonce()
      // Táº¡o HMAC signature
      const signatureData = `${encryptedPayload.data}:${encryptedPayload.iv}:${encryptedPayload.timestamp}:${encryptedPayload.nonce}`
      encryptedPayload.signature = await createHMAC(signatureData, process.env.NEXT_PUBLIC_HMAC_SECRET || 'o24-hmac-secret')
      body = JSON.stringify(encryptedPayload)
    } else {
      body = JSON.stringify(options.body)
    }
  }

  const baseHeaders: {
    [key: string]: string
  } =
    body instanceof FormData
      ? {}
      : {
        'Content-Type': 'application/json'
      }

  // ThÃªm encryption headers náº¿u cáº§n
  if (shouldEncrypt) {
    baseHeaders['X-Encrypted-Request'] = 'true'
    baseHeaders['X-Encryption-Algorithm'] = 'AES-256-GCM'
  }

  if (isClient()) {
    const sessionToken = localStorage.getItem('token')

    if (sessionToken) {
      baseHeaders.Authorization = `Bearer ${sessionToken}`
    }

    // Chỉ gắn scope khi ProjectContext đã ở trạng thái READY (project đã được xác
    // thực nằm trong danh sách được phân quyền của user hiện tại) — không đọc thẳng
    // localStorage ở đây để tránh gửi scope của project chưa/không còn được phép.
    const projectState = useWorkingProjectStore.getState()
    const projectScope = projectState.status === 'READY' ? projectState.project?.code : undefined

    if (projectScope) {
      baseHeaders.scope = projectScope
    }
  }

  const workflowId = getDynamicWorkflowId(options?.body)

  const withWorkflowScope = (headers: Record<string, string>): Record<string, string> => {
    const { scope: requestedScope, ...rest } = headers
    const scope = resolveWorkflowScope(workflowId, requestedScope)

    return scope ? { ...rest, scope } : rest
  }

  // Náº¿u khÃ´ng truyá»n baseUrl (hoáº·c baseUrl = undefined) thÃ¬ láº¥y tá»« envConfig.NEXT_PUBLIC_REST_API_ENDPOINT
  // Náº¿u truyá»n baseUrl thÃ¬ láº¥y giÃ¡ trá»‹ truyá»n vÃ o, truyá»n vÃ o '' thÃ¬ Ä‘á»“ng nghÄ©a vá»›i viá»‡c chÃºng ta gá»i API Ä‘áº¿n Next.js Server

  let baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_REST_API_ENDPOINT
      : options.baseUrl

  // Security boundary: the browser must never call the real backend gateway directly (it would
  // have to carry the backend access token itself to do so). Callers that pass
  // baseUrl: process.env.NEXT_PUBLIC_API_URL (workflowService, bankService, portalService, ...)
  // are rerouted, when running in the browser, to the same-origin Next.js BFF route at the same
  // path (e.g. '/system-service' -> '/api/system-service'), which resolves the real backend
  // token server-side via getBackendToken() instead of trusting anything the client sends.
  //
  // Server-side execution (SSR, Route Handlers) calling '/system-service' is handled separately
  // below (useInProcessSystemServiceCall) — it never goes through this client-only reroute or an
  // HTTP loopback; baseUrl is left untouched here.
  if (isClient() && baseUrl && baseUrl === process.env.NEXT_PUBLIC_API_URL) {
    baseUrl = '/api'
  }

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`

  // Real end-to-end encrypted transport (src/lib/secure-api) for BFF routes that have been
  // migrated to it — browser Network tab only ever sees the opaque envelope for these, never
  // the workflow id/fields/business payload in plaintext. Only applies to same-origin BFF calls
  // with a plain JSON body; FormData uploads and server-to-server calls are unaffected.
  const useSecureApi =
    isClient() &&
    baseUrl === '/api' &&
    SECURE_API_PATHS.has(url) &&
    !(options?.body instanceof FormData)

  // Server-side (SSR / other server code) calls to '/system-service' used to reach the backend
  // via an HTTP loopback through '/api/system-service'. That route now requires the browser's
  // encrypted envelope (src/app/api/_lib/secure-api), which a plain server-to-self call can't
  // speak — and there's no confidentiality reason for a same-process call to be encrypted anyway.
  // Instead, call the exact same existing backend integration in-process: see
  // src/servers/system-service/callBackend.ts, the single implementation shared with
  // src/app/api/system-service/route.ts. The backend URL/headers/body/response contract is
  // untouched — this only changes how that one function gets invoked for this caller.
  const useInProcessSystemServiceCall = !isClient() && url === '/system-service' && baseUrl === process.env.NEXT_PUBLIC_API_URL

  let resStatus: number
  let payload: Response

  if (useInProcessSystemServiceCall) {
    const { callSystemServiceBackend } = await import('@/servers/system-service/callBackend')
    const { SecureApiError } = await import('@/app/api/_lib/secure-api/errors')
    const requestHeaders = { ...baseHeaders, ...(options?.headers as Record<string, string> | undefined) }

    try {
      payload = (await callSystemServiceBackend(
        (options?.body ?? {}) as Record<string, unknown>,
        requestHeaders.uid ?? '',
        {
          lang: requestHeaders.lang,
          app: requestHeaders.app,
          scope: requestHeaders.scope
        }
      )) as Response

      resStatus = 200
    } catch (error) {
      if (error instanceof SecureApiError) {
        resStatus = error.status
        payload = (error.body ?? { message: error.message }) as Response
      } else {
        throw error
      }
    }
  } else if (useSecureApi) {
    const secureResult = await secureFetch<Response>(fullUrl, options?.body ?? {}, {
      method: method as 'POST',
      headers: withWorkflowScope({ ...baseHeaders, ...(options?.headers as Record<string, string> | undefined) })
    })

    if (secureResult.status === 502 && !options?.suppressMaintenanceRedirect) {
      redirectToMaintenance()
      throw new Error('SYSTEM_MAINTENANCE')
    }

    resStatus = secureResult.status
    payload = (secureResult.data ?? secureResult.error) as Response
  } else {
    const res = await fetch(fullUrl, {
      ...options,
      headers: withWorkflowScope({
        ...baseHeaders,
        ...(options?.headers as Record<string, string> | undefined)
      }),
      body,
      method
    })

    // Backend gateway (Cloudflare) trả 502 kèm HTML: không cố parse JSON, chuyển thẳng sang trang bảo trì.
    if (res.status === 502) {
      if (options?.suppressMaintenanceRedirect) {
        throw new HttpError({ status: 502, payload: null })
      }

      redirectToMaintenance()
      throw new Error('SYSTEM_MAINTENANCE')
    }

    resStatus = res.status
    payload = await res.json()
  }

  // Giáº£i mÃ£ response náº¿u cáº§n
  let decryptedPayload = payload
  if (shouldDecryptResponse && typeof payload === 'object' && payload !== null) {
    if (isEncryptedPayload(payload)) {
      try {
        decryptedPayload = await decrypt<Response>((payload as any).data, (payload as any).iv)
      } catch {}
    }
  }

  if (containsSessionNotFoundGrpcError(payload) || containsSessionNotFoundGrpcError(decryptedPayload)) {
    if (isClient()) {
      await logoutClientSession('user_session_not_found')

      return suspendAfterClientLogout<{ status: number; payload: Response }>()
    }

    return createRequireLogoutResponse(decryptedPayload)
  }

  // Check for requireLogout flag in response body (from API route)
  if ((payload as any)?.requireLogout === true) {
    if (isClient()) {
      await logoutClientSession('require_logout_flag')

      return suspendAfterClientLogout<{ status: number; payload: Response }>()
    }

    return createRequireLogoutResponse(decryptedPayload)
  }

  // Backend rejected the session at the workflow layer (HTTP 200 + errors[], e.g. "Phiên đăng nhập
  // không hợp lệ.") — never reaches the 401 branch below. Hand off to the same global client logout
  // (deduplicated across parallel requests) and keep the caller suspended so no feature shows the
  // session error as a business error. Server-side callers keep the legacy check below.
  if (isClient() && isSessionInvalidWorkflowResponse(decryptedPayload)) {
    await logoutClientSession('workflow_session_invalid')

    return suspendAfterClientLogout<{ status: number; payload: Response }>()
  }

  // Xá»¬ lÃ½ case Invalid Token (legacy check)
  if (!isClient()) {
    if (payload) {
      const dataresponse = (payload as any)?.dataresponse;

      if (dataresponse?.error?.[0] || dataresponse?.errors?.[0]) {
        const error = dataresponse.error?.[0] || dataresponse.errors?.[0];
        const errorcode = error?.code;
        const errorinfo = error?.info?.toLowerCase() || '';

        // Check for 401 or token-related errors
        const isTokenError = 
          errorcode === '401' || 
          errorinfo.includes('invalid.token') ||
          errorinfo.includes('invalid token') ||
          errorinfo.includes('token expired') ||
          errorinfo.includes('unauthorized');

        if (isTokenError) {
          try {
            await fetch(`/api/logout`, {
              method: 'POST',
              body: JSON.stringify({ 
                force: true, 
                reason: 'server_side_token_error' 
              }),
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch {}
          
          // Return with requireLogout flag
          return createRequireLogoutResponse(decryptedPayload)
        }
      }
    }
  }


  const data = {
    status: resStatus,
    payload: decryptedPayload
  }

  const resOk = resStatus >= 200 && resStatus < 300


  // Interceptor lÃ  nÆ¡i chÃºng ta xá»­ lÃ½ request vÃ  response trÆ°á»›c khi tráº£ vá» cho phÃ­a component
  if (!resOk) {
    if (resStatus === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422
          payload: EntityErrorPayload
        }
      )
    } else if (resStatus === AUTHENTICATION_ERROR_STATUS) {

      if (isClient()) {
        await logoutClientSession('authentication_error')
        return suspendAfterClientLogout<{ status: number; payload: Response }>()
      } else {
        // Server-side calls never set an `Authorization` header (see isClient() branch above,
        // ~line 302) — it was only ever populated for client-side requests — so reading a Bearer
        // token out of it here used to throw a TypeError on every genuine server-side 401 (e.g. an
        // expired backend session during AuthorizedLayout's SSR auth check), before this branch
        // ever reached the `return data` fallthrough below that the other server-side error
        // statuses (403/404/500/...) already rely on.
      }
    } else if (
      resStatus === VERIFY_ERROR_STATUS ||
      resStatus === BAD_REQUEST ||
      resStatus === NOTFOUND ||
      resStatus === FORBIDDEN ||
      resStatus === INTERNAL_SERVER_ERROR ||
      resStatus === TOO_MANY_REQUESTS ||
      resStatus === SERVICE_UNAVAILABLE ||
      resStatus === GATEWAY_TIMEOUT
    ) {
      return data
    } else {
      throw new HttpError(data)
    }
  }

  // Äáº£m báº£o logic dÆ°á»›i Ä‘Ã¢y chá»‰ cháº¡y á»Ÿ phÃ­a client (browser)
  if (isClient()) {
    if (
      ['login', 'register'].some(
        (item) => item === normalizePath(url)
      )
    ) {

      localStorage.setItem('token', 'token')
    } else if ('logout' === normalizePath(url)) {
      localStorage.removeItem('token')
    }
  }

  return data

}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type HttpResult<Response> = { status: number; payload: Response }

const getTraceStatus = (value: unknown): number | 'error' => (
  value && typeof value === 'object' && typeof (value as { status?: unknown }).status === 'number'
    ? (value as { status: number }).status
    : 'error'
)

/**
 * Browser-side entry point around executeRequest():
 *  - read-only `{ workflowid, fields }` calls to '/system-service' that are byte-for-byte
 *    identical (same user token, project scope, lang, app, body) and overlap in time share one
 *    round trip (see shared/utils/inflightDedupe — nothing is cached after settlement);
 *  - any other request clears the in-flight table so post-mutation reloads never join an older read;
 *  - in development, every request is traced (shared/utils/requestTrace) with a correlation id
 *    forwarded as `x-request-id` so the BFF/server log line can be matched to it.
 * Server-side calls are unchanged (they are traced in callSystemServiceBackend instead).
 */
const request = <Response>(
  method: HttpMethod,
  url: string,
  options?: CustomOptions | undefined
): Promise<HttpResult<Response>> => {
  if (!isClient()) return executeRequest<Response>(method, url, options) as Promise<HttpResult<Response>>

  const workflowId = getDynamicWorkflowId(options?.body)
  const traceEnabled = isRequestTraceEnabled()
  // Keep a caller-supplied correlation id (e.g. the workspace bootstrap's x-request-id shown in its
  // diagnostics) so the BFF log line still matches what the user sees.
  const callerRequestId = (options?.headers as Record<string, string> | undefined)?.['x-request-id']
  const requestId = traceEnabled ? callerRequestId || createRequestId() : ''
  const target = workflowId ? `${url} ${workflowId}` : `${method} ${url}`
  const startedAt = traceEnabled ? Date.now() : 0
  const fingerprint = traceEnabled ? fingerprintPayload(options?.body ?? null) : ''
  const caller = traceEnabled ? resolveCaller() : ''

  const tracedOptions: CustomOptions | undefined = traceEnabled
    ? { ...options, headers: { ...(options?.headers as Record<string, string> | undefined), 'x-request-id': requestId } }
    : options

  const trace = (cache: RequestTraceCache, status: number | 'error') => {
    if (!traceEnabled) return

    recordRequestTrace({
      requestId,
      target,
      startedAt,
      durationMs: Date.now() - startedAt,
      caller,
      fingerprint,
      cache,
      status
    })
  }

  const run = (cache: RequestTraceCache) => {
    const promise = executeRequest<Response>(method, url, tracedOptions) as Promise<HttpResult<Response>>

    promise.then(result => trace(cache, getTraceStatus(result)), () => trace(cache, 'error'))

    return promise
  }

  const isDedupableRead =
    method === 'POST' &&
    url === '/system-service' &&
    options?.baseUrl === process.env.NEXT_PUBLIC_API_URL &&
    workflowId !== null &&
    isReadOnlyWorkflowId(workflowId)

  if (!isDedupableRead) {
    if (method !== 'GET') clearInflightRequests()

    return run('none')
  }

  const projectState = useWorkingProjectStore.getState()
  const scope = projectState.status === 'READY' ? projectState.project?.code ?? '' : ''
  const headers = (options?.headers ?? {}) as Record<string, string>

  // Partitioned by user (uid / local token), project scope and every header/body field that can
  // change the response — two different users or projects can never share a request.
  const key = stableStringify({
    url,
    uid: headers.uid ?? '',
    token: localStorage.getItem('token') ?? '',
    scope: headers.scope ?? scope,
    lang: headers.lang ?? '',
    app: headers.app ?? '',
    encrypt: options?.encrypt ?? false,
    body: options?.body
  })

  let joined = false

  const promise = dedupeInflight(key, () => run('miss'), () => {
    joined = true
  })

  if (joined) {
    promise.then(result => trace('inflight', getTraceStatus(result)), () => trace('inflight', 'error'))
  }

  return promise
}

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('GET', url, options)
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('POST', url, { ...options, body })
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('PUT', url, { ...options, body })
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, 'body'> | undefined
  ) {
    return request<Response>('DELETE', url, { ...options })
  }
}

export default http

