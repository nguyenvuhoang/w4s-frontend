import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// boContextService -> apiPost -> http.ts -> @/configs/config, which validates these at import
// time and throws if missing (they aren't set under vitest). Set them before the dynamic import
// below so module evaluation succeeds — see src/servers/lib/http.test.ts for the same pattern.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'
// apiPost() defaults baseUrl to NEXT_PUBLIC_API_URL, and http.ts's request() only takes the
// in-process backend path (useInProcessSystemServiceCall, calling callSystemServiceBackend
// directly — the real production path for a server-side '/system-service' call) when that same
// baseUrl matches NEXT_PUBLIC_API_URL again. Without this set, it falls back to a plain relative
// fetch('/system-service') instead, which isn't what AuthorizedLayout actually exercises in prod.
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:3000/api'

let boContextService: typeof import('./boContextService').boContextService

beforeAll(async () => {
    ({ boContextService } = await import('./boContextService'))
})

// Regression coverage for the "Add Resident" infinite navigation-overlay bug's session-expiry
// path: AuthorizedLayout (re-run on every navigation, including list -> create) calls
// boContextService.getContext server-side. This confirms the full real chain — backend returns
// HTTP 401 -> callSystemServiceBackend -> http.ts's server-side 401 branch (previously crashed
// with a TypeError reading Authorization.split on undefined) -> boContextService -> caller — ends
// in a clean, typed "UNAUTHORIZED" rejection instead of either crashing or silently resolving
// with a payload the caller could mistake for valid project data.
describe('boContextService.getContext — session-expired (401) handling', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('throws UNAUTHORIZED (not a crash) when the backend returns a genuine 401, and never resolves with project data', async () => {
        // The error message/key deliberately avoid http.ts's OTHER, older 401 detector — the
        // "legacy check" a few lines above the branch this test targets, which pattern-matches on
        // dataresponse.error[0].info/code containing e.g. "invalid token" or code "401" and
        // short-circuits with its own requireLogout response before ever reaching the
        // AUTHENTICATION_ERROR_STATUS branch this fix is about. A message like that would make
        // this test pass for the wrong reason — through the OTHER working path — and never
        // actually exercise (or protect) the branch that used to crash with a TypeError.
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            text: async () => JSON.stringify({ message: 'Session revoked by administrator', error: [{ key: 'SESSION_REVOKED', info: 'Session revoked by administrator', execute_id: 'exec-401' }] })
        }) as any

        const call = boContextService.getContext({ sessiontoken: 'expired-session-token', language: 'vi' })

        await expect(call).rejects.toThrow('UNAUTHORIZED')
    })

    it('returns an empty context without calling the backend when no session token is present', async () => {
        global.fetch = vi.fn() as any

        const result = await boContextService.getContext({ sessiontoken: undefined, language: 'vi' })

        expect(result).toEqual({ userCode: '', isSuperAdmin: false, projects: [] })
        expect(global.fetch).not.toHaveBeenCalled()
    })
})

// WF_BO_GET_BO_CONTEXT availability failures must come out as a typed, classifiable
// BoContextError (serviceUnavailable + httpStatus) so the UI can show the in-place unavailable
// state — not a generic error, and never anything that looks like an auth failure.
describe('boContextService.getContext — service-unavailable classification', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    const call = () => boContextService.getContext({ sessiontoken: 'valid-session-token', language: 'vi' })

    it('classifies the BFF 30s timeout (504 GATEWAY_TIMEOUT) as service-unavailable, not UNAUTHORIZED', async () => {
        global.fetch = vi.fn().mockRejectedValue(
            new DOMException('The operation was aborted due to timeout', 'TimeoutError')
        ) as any

        await expect(call()).rejects.toMatchObject({
            name: 'BoContextError',
            httpStatus: 504,
            serviceUnavailable: true
        })
    })

    it.each([502, 503, 504])('classifies an upstream HTTP %i as service-unavailable', async status => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status,
            statusText: '',
            text: async () => ''
        }) as any

        await expect(call()).rejects.toMatchObject({ httpStatus: status, serviceUnavailable: true })
    })

    it('keeps a workflow business error as a plain (non-unavailable) error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({
                success: false,
                code: 'failed',
                execution_id: 'exec-biz',
                errors: [{ code: 'system.error', info: 'System error occurred.' }]
            })
        }) as any

        await expect(call()).rejects.toMatchObject({
            executionId: 'exec-biz',
            serviceUnavailable: false
        })
    })

    it('keeps an HTTP 400 as a plain (non-unavailable) error', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ message: 'Bad request' })
        }) as any

        await expect(call()).rejects.toMatchObject({ httpStatus: 400, serviceUnavailable: false })
    })

    it.each([403, 500])('classifies a backend HTTP %i as BACKEND_HTTP_ERROR at BO_CONTEXT with its real execution id', async status => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status,
            statusText: '',
            text: async () => JSON.stringify({
                success: false,
                execution_id: `exec-${status}`,
                errors: [{ code: 'system.error', info: 'Backend rejected the call.' }]
            })
        }) as any

        await expect(call()).rejects.toMatchObject({
            name: 'BoContextError',
            stage: 'BO_CONTEXT',
            errorCode: 'BACKEND_HTTP_ERROR',
            httpStatus: status,
            executionId: `exec-${status}`,
            serviceUnavailable: false,
            responseReceived: true
        })
    })

    it('classifies a 2xx workflow failure as WORKFLOW_ERROR', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ success: false, execution_id: 'exec-wf', errors: [{ code: 'x', info: 'y' }] })
        }) as any

        await expect(call()).rejects.toMatchObject({ stage: 'BO_CONTEXT', errorCode: 'WORKFLOW_ERROR', executionId: 'exec-wf' })
    })

    it('resolves the context normally on success', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({
                success: true,
                data: { user_code: 'U001', is_super_admin: false, projects: [{ project_id: 1, project_code: 'P1', project_name: 'Project 1' }] }
            })
        }) as any

        await expect(call()).resolves.toEqual({
            userCode: 'U001',
            isSuperAdmin: false,
            projects: [{ id: 1, code: 'P1', name: 'Project 1' }]
        })
    })
})
