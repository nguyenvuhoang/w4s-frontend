import { readFileSync } from 'node:fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// `@/configs/config` (pulled in transitively by ./http) validates NEXT_PUBLIC_REST_API_ENDPOINT /
// NEXT_PUBLIC_APP_URL at import time and throws if they're missing, which they are under vitest.
// Set them before the dynamic import below so module evaluation succeeds.
process.env.NEXT_PUBLIC_REST_API_ENDPOINT ??= 'https://backend.example.com/api/v1/gateway'
process.env.NEXT_PUBLIC_APP_URL ??= 'https://portal.example.com'

let http: typeof import('./http').default

beforeAll(async () => {
    ({ default: http } = await import('./http'))
})

// Regression coverage for the "Add Resident" infinite navigation-overlay bug's secondary crash:
// server-side calls (SSR, e.g. AuthorizedLayout re-checking auth on every navigation) never carry
// an `Authorization` header — that header is only ever set client-side (see the isClient() branch
// in request()) — so the old server-side 401 branch's
// `(options?.headers as any)?.Authorization.split('Bearer ')[1]` threw a TypeError on every genuine
// server-side 401 instead of falling through to the same `return data` handling every other
// server-side error status (403/404/500/...) already gets.
describe('http (server-side request handling)', () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    it('does not throw on a server-side 401 and returns the status/payload like other error statuses', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            status: 401,
            json: async () => ({ message: 'Invalid token' })
        }) as any

        // Reproduces the real call shape from boContextService.getContext/apiPost: a `headers`
        // object IS present (uid/app/lang/scope, as getDefaultHeaders in servers/lib/api.ts
        // builds it) but never contains `Authorization` — that key is only ever added client-side.
        // `options?.headers?.Authorization` alone would short-circuit safely on a *missing*
        // `headers` object, which is why a naive repro without this `headers` object wouldn't have
        // caught the original bug: the crash only happened when `headers` exists but lacks
        // `Authorization`, since `.split(...)` was then called directly on that `undefined` value.
        const result = await http.post(
            '/some-other-service',
            { foo: 'bar' },
            { baseUrl: 'https://backend.example.com', headers: { uid: 'session-token', app: 'BO' } }
        )

        expect(result).toEqual({ status: 401, payload: { message: 'Invalid token' } })
        // The caller-visible contract: a real caller (boContextService.getContext) branches on
        // this exact field to reject as UNAUTHORIZED — see boContextService.test.ts. This is not
        // a "normal" 2xx-shaped result a caller could mistake for valid data.
        expect(result.status).not.toBe(200)
    })
})

// The CLIENT-side half of the same AUTHENTICATION_ERROR_STATUS branch (isClient() === true) is
// NOT touched by this fix and already has real behavioral coverage risk: it calls
// logoutClientSession(), which clears storage/cookies, calls /api/logout + /api/clear-app,
// next-auth's signOut(), and finally window.location.replace(...) — reproducing that end-to-end
// in vitest would need jsdom (not a project dependency; environment is 'node' — see
// vitest.config.ts) or a hand-built browser-global stub deep enough to satisfy every transitive
// import http.ts pulls in client-side (e.g. sweetalert2, which does its own DOM setup at import
// time and throws under a partial/fake `window`/`document`). That's disproportionate effort for a
// branch this change does not modify. This source check instead pins down the two structural
// guarantees the fix must not break: the client branch still exists, still short-circuits via
// logoutClientSession()+suspendAfterClientLogout() before ever reaching the `return data`
// fallthrough, and the crashing `.split(` call is gone from the server branch.
describe('http.ts — 401 branch structure (source check)', () => {
    const source = readFileSync(new URL('./http.ts', import.meta.url), 'utf8')

    it('keeps the client-side 401 branch calling logoutClientSession + suspendAfterClientLogout, unchanged', () => {
        expect(source).toContain("await logoutClientSession('authentication_error')")
        expect(source).toContain('return suspendAfterClientLogout<{ status: number; payload: Response }>()')
    })

    it('no longer calls .split(...) on a possibly-undefined Authorization header', () => {
        expect(source).not.toContain('Authorization.split(')
        expect(source).not.toContain(')?.Authorization.split')
    })
})

// Wiring of the browser-side in-flight dedup + request tracing (behavior of the helpers themselves
// is covered in shared/utils/inflightDedupe.test.ts and requestTrace.test.ts). Client-side
// execution of request() is not reachable under the node test environment (see note above).
describe('http.ts — read dedup and tracing wiring (source check)', () => {
    const source = readFileSync(new URL('./http.ts', import.meta.url), 'utf8')
    const wrapper = source.slice(source.indexOf('const request = <Response>('), source.indexOf('const http = {'))

    it('leaves server-side calls untouched', () => {
        expect(wrapper).toContain('if (!isClient()) return executeRequest<Response>(method, url, options)')
    })

    it('only dedupes read-only { workflowid, fields } POSTs to /system-service', () => {
        expect(wrapper).toMatch(/method === 'POST' &&\s*url === '\/system-service' &&[\s\S]*isReadOnlyWorkflowId\(workflowId\)/)
    })

    it('clears the in-flight table for every non-read request so post-mutation reloads never join an older read', () => {
        expect(wrapper).toMatch(/if \(!isDedupableRead\) \{\s*if \(method !== 'GET'\) clearInflightRequests\(\)/)
    })

    it('partitions the dedup key by user token, project scope, lang, app and body', () => {
        for (const field of ['uid:', 'token:', 'scope:', 'lang:', 'app:', 'body:']) {
            expect(wrapper).toContain(field)
        }
    })

    it('clears the in-flight table on logout', () => {
        const clearState = source.slice(source.indexOf('const clearBrowserSessionState'), source.indexOf('export const logoutClientSession'))

        expect(clearState).toContain('clearInflightRequests()')
    })

    it('only adds the x-request-id correlation header when tracing is enabled', () => {
        expect(wrapper).toMatch(/const tracedOptions[^=]*= traceEnabled\s*\?/)
    })
})
