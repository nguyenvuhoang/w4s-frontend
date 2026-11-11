import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { POST } from './route'

const buildRequest = (body: Record<string, unknown>) =>
    new Request('http://localhost/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    })

describe('/api/login route', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('surfaces errors[0].info verbatim for account.temporarily.locked (key === "500")', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                code: 'failed',
                success: false,
                message: 'Error occurred',
                execution_id: 'b231d65e1a0a43b4a4b0d01fa66e057a',
                errors: [
                    {
                        key: '500',
                        code: 'account.temporarily.locked',
                        info: '[WF_STEP_CTH_LOGIN] [account.temporarily.locked] Account is temporarily locked until 08:41:23',
                        type_error: 'danger',
                        execute_id: 'b231d65e1a0a43b4a4b0d01fa66e057a'
                    }
                ]
            })
        }) as any

        const res = await POST(buildRequest({ username: 'user1', password: 'pass' }))
        const payload = await res.json()

        expect(res.status).toBe(401)
        expect(payload.message).toBe(
            '[WF_STEP_CTH_LOGIN] [account.temporarily.locked] Account is temporarily locked until 08:41:23'
        )
        expect(payload.error_code).toBe('account.temporarily.locked')
        expect(payload.execution_id).toBe('b231d65e1a0a43b4a4b0d01fa66e057a')
        expect(payload.type_error).toBe('danger')
        // Must NOT be overwritten with a generic "server unavailable" message just because key === "500".
        expect(payload.message).not.toMatch(/temporarily unavailable/i)
    })

    it('falls back to "server unavailable" only when the fetch to the backend actually fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as any

        const res = await POST(buildRequest({ username: 'user1', password: 'pass' }))
        const payload = await res.json()

        expect(res.status).toBe(503)
        expect(payload.message).toMatch(/temporarily unavailable/i)
        expect(payload.error_code).toBe('SERVER_UNAVAILABLE')
    })

    it('falls back to "invalid response" only when the backend body cannot be parsed as JSON', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 502,
            json: async () => { throw new SyntaxError('Unexpected token <') }
        }) as any

        const res = await POST(buildRequest({ username: 'user1', password: 'pass' }))
        const payload = await res.json()

        expect(res.status).toBe(502)
        expect(payload.error_code).toBe('INVALID_RESPONSE')
    })

    it('maps HAVELOGGED business errors to status 299 while keeping the real message', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                errors: [
                    {
                        key: '200',
                        code: 'HAVELOGGED',
                        info: 'This account is already logged in elsewhere.',
                        type_error: 'warning',
                        execute_id: 'exec-123'
                    }
                ]
            })
        }) as any

        const res = await POST(buildRequest({ username: 'user1', password: 'pass' }))
        const payload = await res.json()

        expect(res.status).toBe(299)
        expect(payload.message).toBe('This account is already logged in elsewhere.')
        expect(payload.error_code).toBe('HAVELOGGED')
    })

    it('returns the login data on success', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                errors: [],
                data: { token: 'abc', refresh_token: 'def' }
            })
        }) as any

        const res = await POST(buildRequest({ username: 'user1', password: 'pass' }))
        const payload = await res.json()

        expect(res.status).toBe(200)
        expect(payload).toEqual({ token: 'abc', refresh_token: 'def' })
    })
})
