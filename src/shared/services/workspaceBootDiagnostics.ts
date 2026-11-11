/**
 * Structured diagnostics for the dashboard workspace bootstrap
 * (session -> /api/system-service BFF -> WF_BO_GET_BO_CONTEXT -> /api/project-context -> READY).
 *
 * Rules every value here follows:
 * - Only facts that were actually observed are recorded. `httpStatus` / `executionId` stay null
 *   unless a response really carried them — never synthesized.
 * - `requestId` is the CLIENT correlation id sent as `x-request-id` to the BFF (matches the
 *   `requestId=` field in BFF logs). It is NOT a workflow execution_id and is labelled separately.
 * - Nothing sensitive: no token, cookie, session, Authorization header, raw payload or stack.
 *   Messages are passed through sanitizeDiagnosticText() before they are stored.
 */
import logger from '@lib/logger'

export type WorkspaceBootStage = 'SESSION_CHECK' | 'BFF_REQUEST' | 'BO_CONTEXT' | 'PROJECT_CONTEXT' | 'DASHBOARD_READY'

export type WorkspaceBootErrorCode =
  /** No client-side session marker — the request was never sent. */
  | 'SESSION_MISSING'
  /** BFF/backend said the session is not valid (401 / requireLogout). */
  | 'AUTHENTICATION_REQUIRED'
  /** The browser could not build the encrypted request (missing public key / WebCrypto) — never sent. */
  | 'CLIENT_CONFIGURATION_ERROR'
  /** Threw inside the client transport without an HTTP response; whether it left the browser is unknown. */
  | 'CLIENT_REQUEST_FAILED'
  /** fetch() failed at network level — no response received. */
  | 'NETWORK_ERROR'
  /** No response within the client timeout. */
  | 'TIMEOUT'
  /** 502 / 503 / 504 from the BFF or upstream gateway. */
  | 'SERVICE_UNAVAILABLE'
  /** The BFF itself rejected the call before reaching the backend (secure envelope, key id, replay window, handler crash). */
  | 'BFF_REJECTED'
  /** Non-2xx response that carries the backend/workflow error envelope. */
  | 'BACKEND_HTTP_ERROR'
  /** 2xx but the workflow reported failure (success=false / errors[]). */
  | 'WORKFLOW_ERROR'
  /** 2xx but the body is not a usable workflow response. */
  | 'INVALID_RESPONSE'
  /** Workflow succeeded but returned no user_code. */
  | 'MISSING_USER_CODE'
  /** /api/project-context could not set/clear the working-project scope cookie. */
  | 'PROJECT_SCOPE_SYNC_FAILED'
  | 'UNKNOWN'

export type WorkspaceBootDiagnostic = {
  stage: WorkspaceBootStage
  errorCode: WorkspaceBootErrorCode
  /** Sanitized technical message (for admins / support). Never rendered as the main user message. */
  message: string | null
  httpStatus: number | null
  /** Workflow execution_id returned by the backend — only when the response actually had one. */
  executionId: string | null
  /** Client correlation id (x-request-id) — only when one was sent. */
  requestId: string | null
  /** Backend workflow error code (errors[0].code), when present. */
  workflowErrorCode: string | null
  /** ISO timestamp of when the failure was observed. */
  timestamp: string
  retryable: boolean
  /** true = sent, false = definitely never sent, null = unknown. */
  requestSent: boolean | null
  /** true = an HTTP response was received, false = none, null = unknown / not applicable. */
  responseReceived: boolean | null
}

const NON_RETRYABLE_CODES: ReadonlySet<WorkspaceBootErrorCode> = new Set([
  'SESSION_MISSING',
  'AUTHENTICATION_REQUIRED',
  'CLIENT_CONFIGURATION_ERROR'
])

export const isRetryableBootError = (code: WorkspaceBootErrorCode): boolean => !NON_RETRYABLE_CODES.has(code)

const MAX_MESSAGE_LENGTH = 300

const REDACTIONS: Array<[RegExp, string]> = [
  // Authorization header values / bearer tokens
  [/\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [redacted]'],
  // JWT-like tokens
  [/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]+)?/g, '[redacted-jwt]'],
  // key=value / key: value pairs whose key looks sensitive
  [
    /\b(token|access_token|refresh_token|sessiontoken|session|cookie|set-cookie|authorization|password|passwd|secret|api[_-]?key|uid|signature)\b\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;}]+)/gi,
    '$1=[redacted]'
  ],
  // e-mail addresses (personal data)
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]'],
  // long opaque blobs (keys, base64 payloads, hashes) — above UUID length so ids stay readable
  [/[A-Za-z0-9+/_=-]{40,}/g, '[redacted-blob]']
]

/**
 * Strips anything that could be a credential or personal data from a free-text message and keeps
 * only its first line (so stack traces never get through), truncated to a short length.
 */
export const sanitizeDiagnosticText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null

  let text = typeof value === 'string' ? value : value instanceof Error ? value.message : ''

  if (Array.isArray(value)) text = value.filter(item => typeof item === 'string').join(' ')

  text = text.split(/\r?\n/)[0]?.trim() ?? ''

  if (!text) return null

  for (const [pattern, replacement] of REDACTIONS) {
    text = text.replace(pattern, replacement)
  }

  return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH)}…` : text
}

export const createClientRequestId = (): string => {
  const webCrypto = (globalThis as { crypto?: Crypto }).crypto

  if (webCrypto && typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID()

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const createBootDiagnostic = (
  input: Pick<WorkspaceBootDiagnostic, 'stage' | 'errorCode'> & Partial<Omit<WorkspaceBootDiagnostic, 'stage' | 'errorCode'>>
): WorkspaceBootDiagnostic => ({
  stage: input.stage,
  errorCode: input.errorCode,
  message: sanitizeDiagnosticText(input.message),
  httpStatus: typeof input.httpStatus === 'number' ? input.httpStatus : null,
  executionId: input.executionId ? String(input.executionId) : null,
  requestId: input.requestId ? String(input.requestId) : null,
  workflowErrorCode: input.workflowErrorCode ? String(input.workflowErrorCode) : null,
  timestamp: input.timestamp ?? new Date().toISOString(),
  retryable: input.retryable ?? isRetryableBootError(input.errorCode),
  requestSent: input.requestSent ?? null,
  responseReceived: input.responseReceived ?? null
})

type StageLogDetail = Record<string, string | number | boolean | null | undefined>

/**
 * Structured milestone log through the project's existing logger (consola). Successful
 * milestones are debug-level (hidden at the default level); failures are warnings so they show
 * in the browser console. Callers only pass diagnostic fields — never tokens or payloads.
 */
export const logBootStage = (stage: WorkspaceBootStage, outcome: 'start' | 'ok' | 'fail', detail: StageLogDetail = {}) => {
  const fields = Object.entries(detail)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'string' ? sanitizeDiagnosticText(value) : value}`)
    .join(' ')

  const line = `[workspace-boot] ${stage} ${outcome}${fields ? ` ${fields}` : ''}`

  if (outcome === 'fail') logger.warn(line)
  else logger.debug(line)
}

export type DiagnosticEnvironment = {
  environment?: string | null
  appVersion?: string | null
  host?: string | null
  path?: string | null
  locale?: string | null
  attempt?: number | null
}

/**
 * Plain-text report for the "copy diagnostics" button. Built only from the already-sanitized
 * diagnostic fields plus non-sensitive environment info (host + path, never query/hash).
 */
export const buildDiagnosticReport = (diagnostic: WorkspaceBootDiagnostic, env: DiagnosticEnvironment = {}): string => {
  const line = (label: string, value: unknown) =>
    `${label}: ${value === null || value === undefined || value === '' ? '-' : String(value)}`

  const flag = (value: boolean | null) => (value === null ? 'unknown' : value ? 'yes' : 'no')

  return [
    'IPS workspace bootstrap diagnostics',
    line('Timestamp', diagnostic.timestamp),
    line('Environment', env.environment),
    line('App version', env.appVersion),
    line('Host', env.host),
    line('Path', env.path),
    line('Locale', env.locale),
    line('Attempt', env.attempt),
    line('Stage', diagnostic.stage),
    line('Error code', diagnostic.errorCode),
    line('HTTP status', diagnostic.httpStatus),
    line('Execution ID (workflow)', diagnostic.executionId),
    line('Client request ID (x-request-id)', diagnostic.requestId),
    line('Workflow error code', diagnostic.workflowErrorCode),
    line('Request sent', flag(diagnostic.requestSent)),
    line('Response received', flag(diagnostic.responseReceived)),
    line('Retryable', diagnostic.retryable ? 'yes' : 'no'),
    line('Message', sanitizeDiagnosticText(diagnostic.message))
  ].join('\n')
}
