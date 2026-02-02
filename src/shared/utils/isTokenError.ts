import { ErrorInfo } from '@/shared/types'

/**
 * Check if the error is related to authentication/token issues
 * Returns true if the error should trigger a logout
 */
export const isTokenError = (error?: ErrorInfo | null): boolean => {
    if (!error) return false

    // Check error code
    if (error.code === '401' || error.key === '401') {
        return true
    }

    // Check error info for token-related messages
    const errorInfo = error.info?.toLowerCase() || ''
    
    const tokenErrorPatterns = [
        'invalid.token',
        'invalid token',
        'token expired',
        'token invalid',
        'unauthorized',
        'authentication failed',
        'session expired',
        'not authenticated'
    ]

    return tokenErrorPatterns.some(pattern => errorInfo.includes(pattern))
}
