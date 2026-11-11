import type { ErrorInfo } from '@/shared/types'

/**
 * The backend has no stable error code/key for this case yet (unlike isTokenError's
 * SESSION_INVALID_CODES) — only ever observed as this exact message string, e.g.
 * "The current session does not have the required role for channel [BO]." Kept as a substring
 * match (not an exact-equality check) so a different channel code in the brackets, or minor
 * message formatting differences, still match. Centralized here so the day a stable code/type
 * shows up on this error, only this one function needs to change, not every call site.
 */
const NO_SYSTEM_ACCESS_MESSAGE_PATTERNS = [
    'does not have the required role for channel'
]

/**
 * A DIFFERENT case from isTokenError: the session itself is valid (the user is genuinely logged
 * in), there's just no role/channel assignment letting them into the BO admin system at all. Must
 * not redirect to /logout like a token error would, and must not be treated as a generic
 * technical error either — see NoSystemAccessPage.
 */
export const isNoSystemAccessMessage = (message?: string | null): boolean => {
    if (!message) return false

    const normalized = message.toLowerCase()

    return NO_SYSTEM_ACCESS_MESSAGE_PATTERNS.some(pattern => normalized.includes(pattern))
}

export const isNoSystemAccessError = (error?: ErrorInfo | null): boolean => {
    if (!error) return false

    return isNoSystemAccessMessage(error.info)
}
