import { describe, expect, it } from 'vitest'

import { isSessionInvalidMessage, isSessionInvalidWorkflowResponse } from './isTokenError'

// The exact string boContextService.getContext / AuthorizedLayout throw for an expired/invalid
// backend session (`throw new Error('UNAUTHORIZED')`, and now also the menu-info 401 branch's
// `<ErrorPage error="UNAUTHORIZED" ... />` — see AuthorizedLayout.test.ts) must be recognized here,
// since <ErrorPage /> uses this exact check to decide whether to show "session expired,
// redirecting to login..." and actually redirect, or a plain unrelated-looking generic error.
describe('isSessionInvalidMessage', () => {
    it('matches the plain "UNAUTHORIZED" message thrown for an expired backend session', () => {
        expect(isSessionInvalidMessage('UNAUTHORIZED')).toBe(true)
    })

    it('does not match an unrelated generic error message', () => {
        expect(isSessionInvalidMessage('Failed to fetch authorization data')).toBe(false)
    })
})

// HTTP 200 workflow responses that carry the session error inside errors[] — the case http.ts's
// client-side branch hands to logoutClientSession. Business errors (incl. 403 "no permission")
// must not be treated as a session error.
describe('isSessionInvalidWorkflowResponse', () => {
    it('matches a stable session code inside dataresponse.errors', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: false, errors: [{ code: 'SESSION_REVOKED', info: 'Revoked' }] }
        })).toBe(true)
    })

    it('matches the legacy dataresponse.error[].key 401 shape', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { error: [{ key: '401', info: 'x', execute_id: '' }] }
        })).toBe(true)
    })

    it('falls back to the message when the backend sends no code', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: false, errors: [{ info: 'Phiên đăng nhập không hợp lệ.' }] }
        })).toBe(true)
    })

    it('does not match a business validation error', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: false, errors: [{ code: 'DUPLICATE', info: 'Mã tài sản đã tồn tại.' }] }
        })).toBe(false)
    })

    it('does not treat a 403 permission error as a session error', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: false, errors: [{ code: '403', info: 'Bạn không có quyền thực hiện chức năng này.' }] }
        })).toBe(false)
    })

    it('does not log out on a relayed third-party auth error (e.g. SePay "Unauthorized")', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: false, errors: [{ code: 'BANKHUB_ERROR', info: 'SePay: Unauthorized' }] }
        })).toBe(false)
    })

    it('ignores successful responses', () => {
        expect(isSessionInvalidWorkflowResponse({
            dataresponse: { success: true, data: { hosted_link_url: 'https://x' }, errors: [] }
        })).toBe(false)
    })
})
