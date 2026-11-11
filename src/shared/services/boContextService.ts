import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { env } from '@/env.mjs'
import { apiPost, createDefaultBody } from '@/servers/lib/api'
import { HttpError } from '@/servers/lib/http'
import { isServiceUnavailableError } from '@/shared/utils/serviceUnavailable'
import { getSecureApiClientIssue } from '@/lib/secure-api/crypto-client'
import { clearInflightRequests } from '@/shared/utils/inflightDedupe'
import {
  createClientRequestId,
  isRetryableBootError,
  type WorkspaceBootErrorCode,
  type WorkspaceBootStage
} from '@/shared/services/workspaceBootDiagnostics'

export type BoContextProject = {
  id: number
  code: string
  name: string
}

export type BoContextResult = {
  userCode: string
  isSuperAdmin: boolean
  projects: BoContextProject[]
}

/**
 * Carries the technical detail of a failed WF_BO_GET_BO_CONTEXT call (execution_id + workflow
 * error code/key/type) for logging and error-reference display. `message` is still backend text
 * and must never be rendered as-is in the UI — callers should show a fixed, localized message
 * and use `executionId` only as a reference tag (see useWorkingProjectStore/SelectProjectScreen).
 */
export class BoContextError extends Error {
  executionId?: string
  workflowErrorCode?: string
  workflowErrorKey?: string
  workflowErrorType?: string
  /** HTTP status of /api/system-service (or the in-process backend call) when it was not 2xx. */
  httpStatus?: number
  /** True for timeout / 502 / 503 / 504 / network failure — an availability problem, not auth. */
  serviceUnavailable: boolean
  /** Bootstrap step that failed (see workspaceBootDiagnostics). */
  stage: WorkspaceBootStage
  /** Diagnostic classification (see WorkspaceBootErrorCode). */
  errorCode: WorkspaceBootErrorCode
  /** Client correlation id sent as x-request-id — NOT the workflow execution_id. */
  requestId?: string
  /** true = sent, false = never sent, undefined = unknown. */
  requestSent?: boolean
  /** true = an HTTP response was received, false = none, undefined = unknown. */
  responseReceived?: boolean
  /** ISO time the failure was observed. */
  timestamp: string
  retryable: boolean

  constructor({
    message,
    executionId,
    workflowErrorCode,
    workflowErrorKey,
    workflowErrorType,
    httpStatus,
    serviceUnavailable = false,
    stage = 'BFF_REQUEST',
    errorCode,
    requestId,
    requestSent,
    responseReceived
  }: {
    message: string
    executionId?: string
    workflowErrorCode?: string
    workflowErrorKey?: string
    workflowErrorType?: string
    httpStatus?: number
    serviceUnavailable?: boolean
    stage?: WorkspaceBootStage
    errorCode?: WorkspaceBootErrorCode
    requestId?: string
    requestSent?: boolean
    responseReceived?: boolean
  }) {
    super(message)

    this.name = 'BoContextError'
    this.executionId = executionId
    this.workflowErrorCode = workflowErrorCode
    this.workflowErrorKey = workflowErrorKey
    this.workflowErrorType = workflowErrorType
    this.httpStatus = httpStatus
    this.serviceUnavailable = serviceUnavailable
    this.stage = stage
    this.errorCode = errorCode ?? (serviceUnavailable ? 'SERVICE_UNAVAILABLE' : 'UNKNOWN')
    this.requestId = requestId
    this.requestSent = requestSent
    this.responseReceived = responseReceived
    this.timestamp = new Date().toISOString()
    this.retryable = isRetryableBootError(this.errorCode)
  }
}

/**
 * Client-side ceiling for the whole BFF round trip. The BFF's own backend timeout is 30s
 * (callBackend.ts BACKEND_FETCH_TIMEOUT_MS); this leaves room for route cold start + envelope
 * crypto so a hung BFF never means an infinite boot loader.
 */
export const BO_CONTEXT_CLIENT_TIMEOUT_MS = 45_000

const isBrowser = () => typeof window !== 'undefined'

// BFF-originated error bodies: secure-api wrapper rejections (SECURE_API_*) and callBackend's own
// missing-endpoint configuration error — in both cases the backend was never called.
const isBffOriginatedCode = (code: unknown) =>
  typeof code === 'string' && (code.startsWith('SECURE_API_') || code === 'CONFIGURATION_ERROR')

const hasWorkflowEnvelope = (payload: any): boolean =>
  Boolean(
    payload &&
      typeof payload === 'object' &&
      !isBffOriginatedCode(payload.code) &&
      (payload.dataresponse !== undefined ||
        payload.execution_id !== undefined ||
        Array.isArray(payload.errors) ||
        Array.isArray(payload.error) ||
        typeof payload.code === 'string')
  )

/** Non-2xx response classification: who answered, and what kind of failure it is. */
const classifyHttpFailure = (status: number, payload: unknown): WorkspaceBootErrorCode => {
  if (status === 401) return 'AUTHENTICATION_REQUIRED'
  if (isServiceUnavailableError({ status })) return 'SERVICE_UNAVAILABLE'

  return hasWorkflowEnvelope(payload) ? 'BACKEND_HTTP_ERROR' : 'BFF_REJECTED'
}

const shortPayloadMessage = (payload: any): string | undefined => {
  if (!payload || typeof payload !== 'object') return undefined

  const message = payload.message

  if (typeof message === 'string') return message
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0]

  return undefined
}

const withClientTimeout = <T>(promise: Promise<T>, requestId?: string): Promise<T> => {
  if (!isBrowser()) return promise

  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // The hung request is still registered in http.ts's in-flight dedupe table; without this a
      // Retry would join that same stuck promise and hang again instead of sending a new request.
      clearInflightRequests()

      reject(
        new BoContextError({
          message: `No response from /api/system-service within ${BO_CONTEXT_CLIENT_TIMEOUT_MS}ms.`,
          serviceUnavailable: true,
          stage: 'BFF_REQUEST',
          errorCode: 'TIMEOUT',
          requestId,
          requestSent: true,
          responseReceived: false
        })
      )
    }, BO_CONTEXT_CLIENT_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const pickDataRoot = (payload: any) => {
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
  const data = dataresponse?.data ?? payload?.data ?? payload

  return data?.data ?? data?.input ?? data
}

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['true', '1'].includes(value.trim().toLowerCase())

  return false
}

const mapProject = (item: any): BoContextProject | null => {
  const id = toNumber(getField(item, ['project_id', 'projectId', 'projectid', 'id']), 0)

  if (id <= 0) return null

  const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
  const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name']) ?? '').trim()

  return { id, code, name }
}

// The workflow envelope ({success, code, message, execution_id, errors}) can surface at any of
// these nesting levels depending on the API client/transport used for a given call — never
// hardcode a single path (see WF_BO_GET_BO_CONTEXT failures observed at response.payload
// directly, without a nested dataresponse).
const getWorkflowResponseRoot = (response: any) => {
  return (
    response?.payload?.dataresponse ??
    response?.dataresponse ??
    response?.payload ??
    response
  )
}

/**
 * WF_BO_GET_BO_CONTEXT is intentionally called with empty `fields` and no `scope` header
 * (the HTTP client only attaches `scope` once a project has been chosen and authorized —
 * see useWorkingProjectStore). It returns the user_code and the list of projects the
 * current session is authorized to interact with; the client must never guess/reuse a
 * project outside this list.
 */
export const boContextService = {
  getContext: async ({
    sessiontoken,
    language
  }: {
    sessiontoken?: string
    language?: Locale | string
  }): Promise<BoContextResult> => {
    if (!sessiontoken) {
      return { userCode: '', isSuperAdmin: false, projects: [] }
    }

    // Called with an explicit empty `scope` — this workflow is project-independent and must
    // run BEFORE any project is restored/attached, regardless of whatever project the
    // working-project store may still be holding in memory (e.g. a defensive re-init).
    let response: unknown

    // Client-only: a correlation id the BFF logs as `requestId=` (x-request-id), and a pre-flight
    // check so a request that can never be built is reported as "not sent" instead of looking
    // like a backend failure. Server-side callers keep their existing in-process path untouched.
    const requestId = isBrowser() ? createClientRequestId() : undefined

    if (isBrowser()) {
      const clientIssue = getSecureApiClientIssue()

      if (clientIssue) {
        throw new BoContextError({
          message: `Secure API client is not ready: ${clientIssue}.`,
          stage: 'BFF_REQUEST',
          errorCode: 'CLIENT_CONFIGURATION_ERROR',
          requestId,
          requestSent: false,
          responseReceived: false
        })
      }
    }

    try {
      response = await withClientTimeout(
        apiPost<unknown>(
          '/system-service',
          createDefaultBody(WORKFLOWCODE.WF_BO_GET_BO_CONTEXT, {}),
          sessiontoken,
          {
            lang: (language as string) ?? 'en',
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'SYS',
            scope: '',
            ...(requestId ? { 'x-request-id': requestId } : {})
          },
          // This bootstrap renders its own in-place unavailable state with a retry (see
          // useWorkingProjectStore) — a 502 must reach it instead of hard-redirecting to /maintenance.
          { suppressMaintenanceRedirect: true }
        ),
        requestId
      )
    } catch (err) {
      if (err instanceof BoContextError) throw err

      // Transport-level failure (502/408/409 HttpError, fetch TypeError/AbortError, ...). Re-thrown
      // as a typed BoContextError so callers can classify it without parsing messages.
      const httpStatus = err instanceof HttpError ? err.status : undefined
      const serviceUnavailable = isServiceUnavailableError(err)

      const errorCode: WorkspaceBootErrorCode =
        httpStatus !== undefined
          ? classifyHttpFailure(httpStatus, (err as HttpError).payload)
          : serviceUnavailable
            ? (err as { name?: string })?.name === 'AbortError' || (err as { name?: string })?.name === 'TimeoutError'
              ? 'TIMEOUT'
              : 'NETWORK_ERROR'
            : 'CLIENT_REQUEST_FAILED'

      throw new BoContextError({
        message:
          (httpStatus !== undefined ? shortPayloadMessage((err as HttpError).payload) : undefined) ??
          (err instanceof Error ? err.message : 'Unable to load user context.'),
        httpStatus,
        serviceUnavailable,
        stage: 'BFF_REQUEST',
        errorCode,
        requestId,
        requestSent: errorCode === 'CLIENT_REQUEST_FAILED' ? undefined : true,
        responseReceived: httpStatus !== undefined ? true : errorCode === 'CLIENT_REQUEST_FAILED' ? undefined : false
      })
    }

    const workflowResponse = getWorkflowResponseRoot(response)
    const httpStatus = typeof (response as any)?.status === 'number' ? (response as any).status as number : undefined
    const httpFailed = httpStatus !== undefined && (httpStatus < 200 || httpStatus >= 300)

    if (
      (response as any)?.status === 401 ||
      (response as any)?.requireLogout ||
      (response as any)?.payload?.requireLogout ||
      workflowResponse?.requireLogout
    ) {
      // Message kept as 'UNAUTHORIZED': AuthorizedLayout/ErrorPage key the session-expired flow on it.
      throw new BoContextError({
        message: 'UNAUTHORIZED',
        httpStatus,
        stage: 'SESSION_CHECK',
        errorCode: 'AUTHENTICATION_REQUIRED',
        requestId,
        requestSent: true,
        responseReceived: true
      })
    }

    const errors = Array.isArray(workflowResponse?.errors)
      ? workflowResponse.errors
      : Array.isArray(workflowResponse?.error)
        ? workflowResponse.error
        : []

    const firstError = errors[0]

    // http.ts resolves (not rejects) 503/504/500/... with { status, payload } — check the HTTP
    // status too, otherwise a non-JSON 504 body (payload null) would look like an empty success.
    const workflowFailed =
      httpFailed ||
      workflowResponse?.success === false ||
      String(workflowResponse?.code ?? '').toLowerCase() === 'failed' ||
      errors.length > 0

    if (workflowFailed) {
      const executionId = workflowResponse?.execution_id ?? firstError?.execute_id

      // The thrown BoContextError only carries a short message + executionId, which callers must
      // never render as-is to the end user (see useWorkingProjectStore.initialize / DashboardContent).
      const errorCode: WorkspaceBootErrorCode = httpFailed
        ? classifyHttpFailure(httpStatus as number, (response as any)?.payload)
        : 'WORKFLOW_ERROR'

      throw new BoContextError({
        message: firstError?.info ?? shortPayloadMessage(workflowResponse) ?? 'Unable to load user context.',
        executionId: executionId ? String(executionId) : undefined,
        workflowErrorCode: firstError?.code,
        workflowErrorKey: firstError?.key,
        workflowErrorType: firstError?.type,
        httpStatus: httpFailed ? httpStatus : undefined,
        serviceUnavailable: httpFailed && isServiceUnavailableError({ status: httpStatus }),
        stage: errorCode === 'BFF_REJECTED' ? 'BFF_REQUEST' : 'BO_CONTEXT',
        errorCode,
        requestId,
        requestSent: true,
        responseReceived: true
      })
    }

    // http.ts always resolves { status, payload } — read `payload` strictly so a missing body is
    // not mistaken for the wrapper object itself.
    const responsePayload =
      response && typeof response === 'object' && 'payload' in (response as object) ? (response as any).payload : response

    // A 2xx whose body is not even an object (e.g. an undecryptable secure envelope surfaced as a
    // string) is a real failure — never let it read as "no user_code / no projects".
    if (!responsePayload || typeof responsePayload !== 'object') {
      throw new BoContextError({
        message: typeof responsePayload === 'string' ? responsePayload : 'Empty response body.',
        httpStatus,
        stage: 'BFF_REQUEST',
        errorCode: 'INVALID_RESPONSE',
        requestId,
        requestSent: true,
        responseReceived: true
      })
    }

    const root = pickDataRoot(responsePayload)

    const userCode = String(getField(root, ['user_code', 'userCode', 'usercode']) ?? '').trim()
    const isSuperAdmin = toBoolean(getField(root, ['is_super_admin', 'isSuperAdmin', 'issuperadmin']))
    const rawProjects = getField(root, ['projects']) ?? []

    const projects = (Array.isArray(rawProjects) ? rawProjects : [])
      .map(mapProject)
      .filter((project): project is BoContextProject => project !== null)

    return { userCode, isSuperAdmin, projects }
  }
}
