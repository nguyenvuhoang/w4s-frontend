import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SecureApiError } from '@/app/api/_lib/secure-api/errors'
import logger from '@lib/logger'

import { callSystemServiceBackend } from './callBackend'

// Regression coverage for the "Add Resident" infinite navigation-overlay bug: AuthorizedLayout
// (every page behind it, including /resident/create) awaits this call on every navigation to
// reauthorize the destination route, and NavigationOverlay has no client-side fallback by design
// — it only clears once the destination route's RSC response actually arrives. Before this fix,
// a backend that never responded (e.g. an unhealthy/expired session that hangs instead of
// returning a fast error) left this `fetch()` pending forever, so the overlay spun forever too.
describe('callSystemServiceBackend', () => {
    const originalFetch = global.fetch
    const originalEndpoint = process.env.NEXT_PUBLIC_REST_API_ENDPOINT

    beforeEach(() => {
        vi.restoreAllMocks()
        process.env.NEXT_PUBLIC_REST_API_ENDPOINT = 'https://backend.example.com/system-service'
    })

    afterEach(() => {
        global.fetch = originalFetch
        process.env.NEXT_PUBLIC_REST_API_ENDPOINT = originalEndpoint
    })

    it('bounds the backend fetch with a timeout signal so a hung backend cannot pend forever', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: { data: [] } })
        }) as any

        await callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {})

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [, init] = (global.fetch as any).mock.calls[0]
        expect(init.signal).toBeInstanceOf(AbortSignal)
    })

    it('rejects with a 504 SecureApiError instead of hanging when the backend fetch times out', async () => {
        const timeoutError = new DOMException('The operation was aborted due to timeout', 'TimeoutError')

        global.fetch = vi.fn().mockRejectedValue(timeoutError) as any

        const call = callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {})

        await expect(call).rejects.toBeInstanceOf(SecureApiError)
        await expect(call).rejects.toMatchObject({ status: 504 })
    })

    it('rejects with a 503 SecureApiError when the backend fetch fails for a non-timeout reason', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET')) as any

        const call = callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {})

        await expect(call).rejects.toBeInstanceOf(SecureApiError)
        await expect(call).rejects.toMatchObject({ status: 503 })
    })

    it('logs a timeout at warn level and a real network failure at error level — never the same way', async () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined as any)

        global.fetch = vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')) as any
        await callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {}).catch(() => { })

        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).not.toHaveBeenCalled()

        warnSpy.mockClear()
        errorSpy.mockClear()

        global.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET')) as any
        await callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {}).catch(() => { })

        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy).not.toHaveBeenCalled()
    })

    it('still returns the backend payload normally when the request succeeds (no regression)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: { data: [] } })
        }) as any

        const result = await callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {})

        expect(result).toEqual({ dataresponse: { data: { data: [] } } })
    })
})

// Root cause of "[secure-api] Handler failed for /api/system-service: The operation was aborted
// due to timeout": AbortSignal.timeout(30000) also governs the BODY stream. When the backend sent
// headers in time but the body was still streaming at 30s, `response.text()` rejected with a raw
// TimeoutError outside the fetch() try/catch — it escaped as a non-SecureApiError, so withSecureApi
// logged it as a generic handler failure and answered 500 with no workflow id/duration to trace.
describe('callSystemServiceBackend — failure classification in both phases', () => {
    const originalFetch = global.fetch
    const originalEndpoint = process.env.NEXT_PUBLIC_REST_API_ENDPOINT
    const timeoutError = () => new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    const bodyFailing = (error: unknown, status = 200) => ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => { throw error }
    })
    const jsonResponse = (status: number, body: unknown) => ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body)
    })

    beforeEach(() => {
        vi.restoreAllMocks()
        process.env.NEXT_PUBLIC_REST_API_ENDPOINT = 'https://backend.example.com/system-service?secret=x'
    })

    afterEach(() => {
        global.fetch = originalFetch
        process.env.NEXT_PUBLIC_REST_API_ENDPOINT = originalEndpoint
    })

    it('a timeout while reading the body becomes a 504 SecureApiError (never a raw TimeoutError / generic 500)', async () => {
        vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)
        global.fetch = vi.fn().mockResolvedValue(bodyFailing(timeoutError())) as any

        const call = callSystemServiceBackend({ workflowid: 'WF_BO_LOAD_MENU', fields: {} }, 'token', {})

        await expect(call).rejects.toBeInstanceOf(SecureApiError)
        await expect(call).rejects.toMatchObject({ status: 504, body: { code: 'GATEWAY_TIMEOUT' } })
    })

    it('logs one structured line with request id, workflow, endpoint, phase, duration, timeout, status and a hashed scope', async () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined as any)

        global.fetch = vi.fn().mockResolvedValue(bodyFailing(timeoutError())) as any

        await callSystemServiceBackend(
            { workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} },
            'super-secret-token',
            { scope: 'PROJECT_A', requestId: 'rq-test-1' }
        ).catch(() => { })

        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).not.toHaveBeenCalled()

        const line = String(warnSpy.mock.calls[0][0])

        expect(line).toContain('TIMEOUT')
        expect(line).toContain('requestId=rq-test-1')
        expect(line).toContain('workflow=WF_BO_GET_BO_CONTEXT')
        expect(line).toContain('endpoint=backend.example.com/system-service ')
        expect(line).toContain('phase=body')
        expect(line).toMatch(/duration=\d+ms/)
        expect(line).toContain('timeout=30000ms')
        expect(line).toContain('httpStatus=200')
        expect(line).toMatch(/scope=[0-9a-f]{8}/)
        expect(line).not.toContain('PROJECT_A')
        expect(line).not.toContain('super-secret-token')
        expect(line).not.toContain('secret=x')
    })

    it('a timeout while waiting for headers is reported with phase=headers and no http status', async () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)

        global.fetch = vi.fn().mockRejectedValue(timeoutError()) as any

        await callSystemServiceBackend({ workflowid: 'WF_BO_LOAD_MENU', fields: {} }, 'token', {}).catch(() => { })

        const line = String(warnSpy.mock.calls[0][0])

        expect(line).toContain('TIMEOUT')
        expect(line).toContain('phase=headers')
        expect(line).toContain('httpStatus=none')
    })

    it('the backend closing the connection mid-body is a NETWORK_ERROR -> 503, logged at error level', async () => {
        const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined as any)

        global.fetch = vi.fn().mockResolvedValue(bodyFailing(new TypeError('terminated'))) as any

        const call = callSystemServiceBackend({ workflowid: 'WF_BO_LOAD_MENU', fields: {} }, 'token', {})

        await expect(call).rejects.toMatchObject({ status: 503, body: { code: 'SERVICE_UNAVAILABLE' } })
        expect(String(errorSpy.mock.calls[0][0])).toContain('NETWORK_ERROR')
    })

    it('a failure after the browser aborted its BFF request is classified CLIENT_ABORT, not a backend outage', async () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)
        const controller = new AbortController()

        controller.abort()
        global.fetch = vi.fn().mockResolvedValue(bodyFailing(new TypeError('terminated'))) as any

        const call = callSystemServiceBackend(
            { workflowid: 'WF_BO_SIMPLE_SEARCH_RESIDENTS', fields: {} },
            'token',
            { clientSignal: controller.signal }
        )

        await expect(call).rejects.toMatchObject({ status: 499, body: { code: 'CLIENT_CLOSED_REQUEST' } })
        expect(String(warnSpy.mock.calls[0][0])).toContain('CLIENT_ABORT')
    })

    it('never forwards the client signal or the correlation id to the backend fetch', async () => {
        const controller = new AbortController()

        global.fetch = vi.fn().mockResolvedValue(jsonResponse(200, { data: {} })) as any

        await callSystemServiceBackend(
            { workflowid: 'WF_BO_UPDATE_X', fields: {} },
            'token',
            { clientSignal: controller.signal, requestId: 'rq-1' }
        )

        const [, init] = (global.fetch as any).mock.calls[0]

        expect(init.signal).not.toBe(controller.signal)
        expect(init.headers).not.toHaveProperty('x-request-id')
    })

    it.each([401, 403, 500, 503, 504])('backend HTTP %i keeps its status and is never misreported as a timeout', async status => {
        vi.spyOn(logger, 'warn').mockImplementation(() => undefined as any)
        vi.spyOn(logger, 'error').mockImplementation(() => undefined as any)
        global.fetch = vi.fn().mockResolvedValue(jsonResponse(status, { message: 'backend says no' })) as any

        const call = callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {})

        await expect(call).rejects.toBeInstanceOf(SecureApiError)
        await expect(call).rejects.toMatchObject({ status, message: 'backend says no' })
        await expect(call).rejects.not.toMatchObject({ body: { code: 'GATEWAY_TIMEOUT' } })
    })

    it('two workflows in parallel each get their own result, own timeout signal and one fetch each', async () => {
        global.fetch = vi.fn(async (_url: string, init: RequestInit) => {
            const workflowid = JSON.parse(String(init.body)).workflowid

            return jsonResponse(200, { workflow: workflowid })
        }) as any

        const [context, menu] = await Promise.all([
            callSystemServiceBackend({ workflowid: 'WF_BO_GET_BO_CONTEXT', fields: {} }, 'token', {}),
            callSystemServiceBackend({ workflowid: 'WF_BO_LOAD_MENU', fields: {} }, 'token', {})
        ])

        expect(context).toEqual({ dataresponse: { workflow: 'WF_BO_GET_BO_CONTEXT' } })
        expect(menu).toEqual({ dataresponse: { workflow: 'WF_BO_LOAD_MENU' } })
        expect(global.fetch).toHaveBeenCalledTimes(2)

        const [[, a], [, b]] = (global.fetch as any).mock.calls

        expect(a.signal).not.toBe(b.signal)
    })

    describe('scope header', () => {
        const okFetch = () => vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ success: true })
        }) as any

        const sentHeaders = (): Record<string, string> => (global.fetch as any).mock.calls[0][1].headers

        it('never sends a scope header for WF_BO_LOAD_MENU, even when the caller has a project scope', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend(
                { workflowid: 'WF_BO_LOAD_MENU', fields: { channel: 'BO' } },
                'token',
                { scope: 'NGHIA-TEST', lang: 'vi', app: 'BO', deviceId: 'dev-1' }
            )

            const headers = sentHeaders()

            expect(headers).not.toHaveProperty('scope')
            expect(headers).toMatchObject({ uid: 'token', lang: 'vi', app: 'BO', 'content-type': 'application/json' })
            expect(headers.my_device).toBe(JSON.stringify({ device_id: 'dev-1' }))
        })

        it('never sends a scope header for WF_BO_LOAD_MENU when the caller has no scope (SSR path)', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend({ workflowid: 'WF_BO_LOAD_MENU', fields: { channel: 'BO' } }, 'token', {})

            expect(sentHeaders()).not.toHaveProperty('scope')
        })

        it('still forwards the project scope for other workflows', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend({ workflowid: 'WF_BO_SEARCH_ASSET', fields: {} }, 'token', { scope: 'NGHIA-TEST' })

            expect(sentHeaders().scope).toBe('NGHIA-TEST')
        })

        it('never sends a scope header for WF_BO_SIMPLE_SEARCH_PROJECTS, even when the caller has a project scope', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend(
                { workflowid: 'WF_BO_SIMPLE_SEARCH_PROJECTS', fields: { search_text: '' } },
                'token',
                { scope: 'NGHIA-TEST' }
            )

            expect(sentHeaders()).not.toHaveProperty('scope')
        })

        it('omits the scope header for project workflows when the caller has none', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend({ workflowid: 'WF_BO_SEARCH_ASSET', fields: {} }, 'token', {})

            expect(sentHeaders()).not.toHaveProperty('scope')
        })

        it('omits the scope header for project workflows when the caller sends an empty scope', async () => {
            global.fetch = okFetch()

            await callSystemServiceBackend({ workflowid: 'WF_BO_SEARCH_ASSET', fields: {} }, 'token', { scope: '  ' })

            expect(sentHeaders()).not.toHaveProperty('scope')
        })
    })
})
