import { describe, expect, it } from 'vitest'

import { isServiceUnavailableError } from './serviceUnavailable'

describe('isServiceUnavailableError', () => {
    it.each([502, 503, 504])('treats status %i as unavailable', status => {
        expect(isServiceUnavailableError({ status })).toBe(true)
        expect(isServiceUnavailableError({ httpStatus: status })).toBe(true)
        expect(isServiceUnavailableError({ statusCode: status })).toBe(true)
    })

    it.each([400, 401, 403, 404, 422, 500])('never treats status %i as unavailable', status => {
        expect(isServiceUnavailableError({ status })).toBe(false)
    })

    it('prefers a structured status over the message', () => {
        expect(isServiceUnavailableError({ status: 401, message: 'Gateway Timeout' })).toBe(false)
    })

    it('treats timeouts, aborts and browser network failures as unavailable', () => {
        expect(isServiceUnavailableError(new DOMException('timeout', 'TimeoutError'))).toBe(true)
        expect(isServiceUnavailableError(new DOMException('aborted', 'AbortError'))).toBe(true)
        expect(isServiceUnavailableError(new TypeError('Failed to fetch'))).toBe(true)
        expect(isServiceUnavailableError(new Error('SYSTEM_MAINTENANCE'))).toBe(true)
    })

    it('does not treat auth or arbitrary errors as unavailable', () => {
        expect(isServiceUnavailableError(new Error('UNAUTHORIZED'))).toBe(false)
        expect(isServiceUnavailableError(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe(false)
        expect(isServiceUnavailableError(null)).toBe(false)
        expect(isServiceUnavailableError('504')).toBe(false)
    })
})
