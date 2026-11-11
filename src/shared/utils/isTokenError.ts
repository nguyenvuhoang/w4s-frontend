import type { ErrorInfo } from '@/shared/types'

const SESSION_NOT_FOUND_GRPC_MESSAGE = "gRPC call [GetUserSessionAsync] failed with message 'Not found.'."

/**
 * Substrings (lowercased) that identify an invalid/expired session, whether they arrive as a
 * structured workflow ErrorInfo.info or as a plain rendered error string (e.g. the text handed
 * to <ErrorPage />). Kept in one place so every detector below — and any future one — stays in
 * sync instead of drifting into slightly different pattern lists.
 */
const SESSION_INVALID_MESSAGE_PATTERNS = [
    'phiên đăng nhập không hợp lệ',
    'invalid.token',
    'invalid token',
    'invalid session',
    'token expired',
    'token invalid',
    'unauthorized',
    'authentication failed',
    'session expired',
    'not authenticated',
    SESSION_NOT_FOUND_GRPC_MESSAGE.toLowerCase()
]

/** HTTP/workflow status codes that always mean "the session is no longer valid". */
const SESSION_INVALID_CODES = ['401', '403']

/**
 * Matches a plain-text error message (with or without an "ExecutionID: ..." prefix — substring
 * match handles both) against known invalid-session phrasings, VI and EN. Used by <ErrorPage />
 * so any screen that ends up rendering a raw error string there gets the same logout behavior,
 * without every call site having to know about session errors itself.
 */
export const isSessionInvalidMessage = (message?: string | null): boolean => {
    if (!message) return false

    const normalized = message.toLowerCase()

    return SESSION_INVALID_MESSAGE_PATTERNS.some(pattern => normalized.includes(pattern))
}

/**
 * Check if the error is related to authentication/token issues
 * Returns true if the error should trigger a logout
 */
export const isTokenError = (error?: ErrorInfo | null): boolean => {
    if (!error) return false

    // Check error code
    if (SESSION_INVALID_CODES.includes(String(error.code)) || SESSION_INVALID_CODES.includes(String(error.key))) {
        return true
    }

    // Check error info for token-related messages
    return isSessionInvalidMessage(error.info)
}

/**
 * Error codes/keys the backend and BFF actually emit for an invalid session inside a workflow
 * response body: `401` (BFF createErrorDataResponse key), `UNAUTHORIZED` (BFF/callBackend code) and
 * `SESSION_REVOKED` (backend key). `403` is deliberately NOT here, unlike SESSION_INVALID_CODES:
 * inside a workflow body it means "no permission for this function", which must not log out.
 */
const WORKFLOW_SESSION_INVALID_CODES = ['401', 'UNAUTHORIZED', 'SESSION_REVOKED']

type WorkflowErrorItem = {
    code?: unknown
    key?: unknown
    info?: unknown
    message?: unknown
}

const collectWorkflowErrors = (root: unknown): WorkflowErrorItem[] => {
    if (!root || typeof root !== 'object') return []

    const record = root as Record<string, unknown>

    return [record.errors, record.error]
        .filter(Array.isArray)
        .flat()
        .filter((item): item is WorkflowErrorItem => !!item && typeof item === 'object')
}

const toText = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')

/**
 * Message fallback for workflow bodies only — narrower than SESSION_INVALID_MESSAGE_PATTERNS on
 * purpose: a workflow can relay a THIRD-PARTY error (e.g. SePay "Unauthorized", "token expired")
 * that says nothing about the user's own session and must stay a normal business error.
 */
const WORKFLOW_SESSION_INVALID_MESSAGE_PATTERNS = [
    'phiên đăng nhập không hợp lệ',
    'phiên đăng nhập đã hết hạn',
    'invalid session',
    'session expired',
    'invalid.token',
    SESSION_NOT_FOUND_GRPC_MESSAGE.toLowerCase()
]

const isWorkflowSessionInvalidMessage = (value: unknown) => {
    const normalized = toText(value).toLowerCase()

    return !!normalized && WORKFLOW_SESSION_INVALID_MESSAGE_PATTERNS.some(pattern => normalized.includes(pattern))
}

/**
 * Detects an invalid/expired session reported INSIDE a workflow response body (HTTP 200 + errors[]),
 * which never reaches the HTTP 401 handling. Accepts the raw `/system-service` payload
 * (`{ dataresponse: backendBody }`) or the backend body itself. Stable codes are checked first; the
 * message patterns are only the fallback for backends that send no code.
 */
export const isSessionInvalidWorkflowResponse = (payload: unknown): boolean => {
    if (!payload || typeof payload !== 'object') return false

    const record = payload as Record<string, unknown>
    const errors = [
        ...collectWorkflowErrors(record.dataresponse),
        ...collectWorkflowErrors(record)
    ]

    if (errors.length === 0) return false

    const hasSessionCode = errors.some(error => (
        WORKFLOW_SESSION_INVALID_CODES.includes(toText(error.code).toUpperCase())
        || WORKFLOW_SESSION_INVALID_CODES.includes(toText(error.key).toUpperCase())
    ))

    if (hasSessionCode) return true

    return errors.some(error => isWorkflowSessionInvalidMessage(error.info) || isWorkflowSessionInvalidMessage(error.message))
}
